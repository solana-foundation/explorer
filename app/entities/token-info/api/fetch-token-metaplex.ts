import { getUmi } from '@entities/nft/@x/token-info';
import {
    findMetadataPda,
    type Metadata,
    safeFetchAllMetadata,
    TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import { publicKey, unwrapOption } from '@metaplex-foundation/umi';
import { Connection, PublicKey } from '@solana/web3.js';

import { MAX_SIZE, USER_AGENT } from '@/app/api/metadata/proxy/config';
import { fetchResource, matchJsonContent } from '@/app/api/metadata/proxy/feature';

import type { TokenInfo } from '../lib/types';

/**
 * Milliseconds to wait for one mint's off-chain JSON. Carried over from the
 * `metaplexTimeout` default in `@solflare-wallet/utl-sdk`.
 */
export const METAPLEX_TIMEOUT_MS = 5_000;

/** Decimals reported when the mint account is missing or unparseable. */
const DEFAULT_DECIMALS = 6;

/** `getMultipleAccounts` accepts at most 100 keys per request. */
const ACCOUNTS_CHUNK_SIZE = 100;

export type FetchTokenInfosMetaplexOptions = {
    onError?: (error: unknown) => void;
};

const NULL_CHAR = String.fromCharCode(0);

/**
 * Strips the null padding the token metadata program adds to fixed-width
 * strings. Matches `removeEmptyChars` in `@metaplex-foundation/js`, which the
 * SDK relied on to clean up on-chain names and symbols.
 */
function removeEmptyChars(value: string): string {
    return value.split(NULL_CHAR).join('');
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

/**
 * Reads `decimals` for each mint. Mirrors the SDK, which fetched the parsed
 * mint accounts separately because the metadata account does not carry them.
 */
async function fetchDecimals(
    mints: string[],
    rpcEndpoint: string,
    onError?: (error: unknown) => void,
): Promise<Map<string, number>> {
    const decimals = new Map<string, number>();
    if (mints.length === 0) return decimals;

    const connection = new Connection(rpcEndpoint);

    await Promise.all(
        chunk(mints, ACCOUNTS_CHUNK_SIZE).map(async batch => {
            try {
                const { value } = await connection.getMultipleParsedAccounts(batch.map(mint => new PublicKey(mint)));
                value.forEach((account, index) => {
                    const data = account?.data;
                    if (!data || !('parsed' in data)) return;
                    const parsedDecimals = data.parsed?.info?.decimals;
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
 * Reads one mint's off-chain JSON to find its logo, bounded by `METAPLEX_TIMEOUT_MS`.
 *
 * A mint's `uri` is attacker-controlled on-chain data, so this calls the metadata proxy's
 * `fetchResource` in process rather than requesting `/api/metadata/proxy` over HTTP. Same
 * hardening — per-hop private-IP rejection, protocol and redirect validation, size cap — with
 * no round trip, and nothing derived from the incoming request's host.
 *
 * Resolves to `null`, not `undefined`, because `TokenInfo.logoURI` is `string | null` in the
 * UTL REST contract and this value is serialised straight into it.
 */
async function fetchLogoUri(metadata: Metadata, options: FetchTokenInfosMetaplexOptions): Promise<string | null> {
    // eslint-disable-next-line unicorn/no-null -- `TokenInfo.logoURI` is `string | null` per the UTL contract
    if (!metadata.uri) return null;

    try {
        const { data, headers } = await fetchResource(metadata.uri, {
            headers: new Headers({ 'User-Agent': USER_AGENT }),
            size: MAX_SIZE,
            timeout: METAPLEX_TIMEOUT_MS,
        });
        // eslint-disable-next-line unicorn/no-null -- same contract as above
        if (!matchJsonContent(headers.get('content-type'))) return null;
        const image = (data as { image?: unknown } | undefined)?.image;
        // eslint-disable-next-line unicorn/no-null -- same contract as above
        return typeof image === 'string' ? image : null;
    } catch (error) {
        // A dead link, a slow host, or a blocked address is routine for third-party metadata.
        options.onError?.(error);
        // eslint-disable-next-line unicorn/no-null -- same contract as above
        return null;
    }
}

/**
 * Resolves token info from on-chain Metaplex metadata. Use this for mints the
 * unified token list (UTL) API does not carry.
 *
 * This replaces the Metaplex fallback in `@solflare-wallet/utl-sdk`. Like the
 * SDK it returns only mints whose token standard is `Fungible`, and it marks
 * every result unverified because the data is not on a curated list.
 */
export async function getTokenInfosFromMetaplex(
    addresses: string[],
    rpcEndpoint: string,
    options: FetchTokenInfosMetaplexOptions = {},
): Promise<TokenInfo[]> {
    if (addresses.length === 0 || !rpcEndpoint) return [];

    let fungible: Metadata[];
    try {
        const umi = getUmi(rpcEndpoint);
        const pdas = addresses.map(address => findMetadataPda(umi, { mint: publicKey(address) }));

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

    const [decimals, logoUris] = await Promise.all([
        fetchDecimals(
            fungible.map(metadata => metadata.mint.toString()),
            rpcEndpoint,
            options.onError,
        ),
        Promise.all(fungible.map(metadata => fetchLogoUri(metadata, options))),
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
