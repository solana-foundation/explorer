import { getRpc } from '@entities/cluster/@x/token-info';
import { getUmi } from '@entities/nft/@x/token-info';
import {
    findMetadataPda,
    type Metadata,
    safeFetchAllMetadata,
    TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import { publicKey, unwrapOption } from '@metaplex-foundation/umi';
import { address } from '@solana/kit';
import { fetchAll } from '@utils/fetch-all';

import {
    fetchResource,
    logProxyError,
    logResourceFetched,
    matchJsonContent,
    MAX_SIZE,
    USER_AGENT,
} from '@/app/api/metadata/proxy';
import { chunk } from '@/app/shared/lib/array';
import { resolveIpfsUri } from '@/app/shared/lib/ipfs';
import { parseUrl } from '@/app/shared/lib/url';

import { isRedactedTokenAddress } from '../lib/is-redacted-token-address';
import type { TokenInfo } from '../lib/types';

export const METAPLEX_TIMEOUT_MS = 5_000;

export const LOGO_CONCURRENCY = 8;

/**
 * Wall clock the off-chain reads may spend across one batch, in milliseconds.
 * `METAPLEX_TIMEOUT_MS` bounds a single read, but a run of slow hosts would still
 * add up past the route's `maxDuration` and lose the whole response. Past this
 * point the remaining mints report no `logoURI`, so names, symbols and
 * decimals — which come from the metadata and mint accounts — still arrive.
 */
export const LOGO_BUDGET_MS = 10_000;

/** Decimals reported when the mint account is missing or unparseable. */
const DEFAULT_DECIMALS = 6;

/** `getMultipleAccounts` accepts at most 100 keys per request. */
const ACCOUNTS_CHUNK_SIZE = 100;

export type FetchTokenInfosMetaplexOptions = {
    onError?: (error: unknown) => void;
};

const NULL_CHAR = String.fromCharCode(0);

function removeEmptyChars(value: string): string {
    return value.split(NULL_CHAR).join('');
}

async function fetchDecimals(
    mints: string[],
    rpcEndpoint: string,
    onError?: (error: unknown) => void,
): Promise<Map<string, number>> {
    const decimals = new Map<string, number>();
    if (mints.length === 0) return decimals;

    const rpc = getRpc(rpcEndpoint);

    await Promise.all(
        chunk(mints, ACCOUNTS_CHUNK_SIZE).map(async batch => {
            try {
                const { value } = await rpc
                    .getMultipleAccounts(
                        batch.map(mint => address(mint)),
                        { encoding: 'jsonParsed' },
                    )
                    .send();
                value.forEach((account, index) => {
                    const data = account?.data;
                    if (!data || !('parsed' in data)) return;
                    const parsedDecimals = (data.parsed as { info?: { decimals?: unknown } }).info?.decimals;
                    if (typeof parsedDecimals === 'number') {
                        decimals.set(batch[index], parsedDecimals);
                    }
                });
            } catch (error) {
                onError?.(error);
            }
        }),
    );

    return decimals;
}

/**
 * Resolves a mint's on-chain `uri` to something `fetchResource` can read.
 *
 * `ipfs://` is common in metadata and `fetchResource` speaks only http(s), so an ipfs URI is
 * mapped to the same gateway the browser path uses via `getProxiedUri`. Without this every
 * unlisted mint hosted on IPFS reports a blocked protocol instead of a logo.
 *
 * Returns '' when the URI names nothing readable — unparseable, or an ipfs address with a
 * malformed CID. Any other URI passes through unchanged.
 */
function resolveMetadataUri(uri: string): string {
    const url = parseUrl(uri);
    if (!url) return '';
    const ipfs = resolveIpfsUri(url);
    if (!ipfs) return uri;
    return ipfs.kind === 'gateway' ? ipfs.uri : '';
}

/**
 * Reads one mint's off-chain JSON to find its logo, bounded by `METAPLEX_TIMEOUT_MS` and by
 * whatever is left of the batch's `deadline`.
 *
 * A mint's `uri` is attacker-controlled on-chain data, so this calls the metadata proxy's
 * `fetchResource` in process rather than requesting `/api/metadata/proxy` over HTTP. Same
 * hardening — per-hop private-IP rejection, protocol and redirect validation, size cap — with
 * no round trip, and nothing derived from the incoming request's host.
 */
async function fetchLogoUri(
    metadata: Metadata,
    deadline: number,
    options: FetchTokenInfosMetaplexOptions,
): Promise<string | undefined> {
    // Covers a mint with no `uri` at all, as well as one naming nothing readable.
    const uri = resolveMetadataUri(metadata.uri);
    if (!uri) return undefined;

    const timeout = Math.min(METAPLEX_TIMEOUT_MS, deadline - Date.now());
    // The batch has spent its budget; the mints still queued give up their logo rather than the
    // request giving up its response.
    if (timeout <= 0) return undefined;

    try {
        const [error, resource] = await fetchResource(uri, {
            headers: new Headers({ 'User-Agent': USER_AGENT }),
            size: MAX_SIZE,
            timeout,
        });
        if (error) {
            // A dead link, a slow host, or a blocked address is routine for third-party metadata.
            // `logProxyError` owns the log, so `onError` would log the failure a second time.
            logProxyError(error);
            return undefined;
        }
        logResourceFetched(resource, MAX_SIZE);
        const { data, headers } = resource;
        if (!matchJsonContent(headers.get('content-type'))) return undefined;
        const image = (data as { image?: unknown } | undefined)?.image;
        return typeof image === 'string' ? image : undefined;
    } catch (error) {
        options.onError?.(error);
        return undefined;
    }
}

export async function getTokenInfosFromMetaplex(
    addresses: string[],
    rpcEndpoint: string,
    options: FetchTokenInfosMetaplexOptions = {},
): Promise<TokenInfo[]> {
    const unredactedAddresses = addresses.filter(address => !isRedactedTokenAddress(address));
    if (unredactedAddresses.length === 0 || !rpcEndpoint) return [];

    let fungible: Metadata[];
    try {
        const umi = getUmi(rpcEndpoint);
        const pdas = unredactedAddresses.map(address => findMetadataPda(umi, { mint: publicKey(address) }));

        // Umi sends every key in a single `getMultipleAccounts` call, so batch here to stay under
        // the RPC limit. One failed batch must not lose the mints the others resolved.
        const batches = await Promise.all(
            chunk(pdas, ACCOUNTS_CHUNK_SIZE).map(async batch => {
                try {
                    return await safeFetchAllMetadata(umi, batch);
                } catch (error) {
                    options.onError?.(error);
                    return [];
                }
            }),
        );

        fungible = batches.flat().filter(metadata => unwrapOption(metadata.tokenStandard) === TokenStandard.Fungible);
    } catch (error) {
        options.onError?.(error);
        return [];
    }

    if (fungible.length === 0) return [];

    const deadline = Date.now() + LOGO_BUDGET_MS;

    const [decimals, logoUris] = await Promise.all([
        fetchDecimals(
            fungible.map(metadata => metadata.mint.toString()),
            rpcEndpoint,
            options.onError,
        ),
        // `fetchAll` runs at most `LOGO_CONCURRENCY` reads at a time and keeps the results in the
        // order the mints were given, so `logoUris[index]` below still belongs to `fungible[index]`.
        fetchAll(fungible, metadata => fetchLogoUri(metadata, deadline, options), LOGO_CONCURRENCY),
    ]);

    return fungible.map((metadata, index) => ({
        address: metadata.mint.toString(),
        decimals: decimals.get(metadata.mint.toString()) ?? DEFAULT_DECIMALS,
        logoURI: logoUris[index],
        name: removeEmptyChars(metadata.name),
        symbol: removeEmptyChars(metadata.symbol),
        verified: false,
    }));
}
