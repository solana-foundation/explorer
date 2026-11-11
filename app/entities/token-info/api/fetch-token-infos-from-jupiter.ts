import 'server-only';

import { getChainId } from '@entities/chain-id/@x/token-info';
import { chunk } from '@shared/lib/array';
import { Cluster } from '@utils/cluster';
import { array, type Infer, is } from 'superstruct';

import { fetchUpstream } from '@/app/shared/lib/http-utils';

import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../lib/errors';
import { jupiterListsTokensOn } from '../lib/jupiter-lists-tokens-on';
import { JUPITER_TOKENS_SEARCH_URL, JupiterTokenStruct } from '../lib/jupiter-token';
import { TOKEN_INFO_REQUEST_LIMIT } from '../lib/request-limit';
import { type TokenInfo } from '../lib/types';

type TokenInfosResult =
    { kind: 'resolved'; tokens: TokenInfo[]; malformed: number } | { kind: 'unavailable'; error: unknown };

export async function getTokenInfos(
    addresses: string[],
    cluster: Cluster,
    genesisHash?: string,
    config?: { signal?: AbortSignal },
): Promise<TokenInfosResult> {
    if (addresses.length === 0) return NOTHING_LISTED;
    if (!jupiterListsTokensOn(getChainId(cluster, genesisHash))) return NOTHING_LISTED;

    const apiKey = process.env.JUPITER_API_KEY;
    if (!apiKey) return { error: new Error('JUPITER_API_KEY is not configured'), kind: 'unavailable' };

    const results = await Promise.all(
        chunk(addresses, TOKEN_INFO_REQUEST_LIMIT).map(mints =>
            fetchTokenInfosFromJupiter({ apiKey, mints, signal: config?.signal }),
        ),
    );

    const tokens: TokenInfo[] = [];
    let malformed = 0;
    for (const result of results) {
        if (result.kind === 'unavailable') return result;
        tokens.push(...result.tokens);
        malformed += result.malformed;
    }
    return { kind: 'resolved', malformed, tokens };
}

export async function getTokenInfo(
    address: string,
    cluster: Cluster,
    genesisHash?: string,
    config?: { signal?: AbortSignal; onError?: (error: unknown) => void },
): Promise<TokenInfo | undefined> {
    const result = await getTokenInfos([address], cluster, genesisHash, config);
    if (result.kind === 'unavailable') {
        config?.onError?.(result.error);
        return undefined;
    }
    if (result.malformed > 0) {
        config?.onError?.(new TokenInfoInvalidResponseError(`Invalid response: dropped ${result.malformed} tokens`));
    }
    return result.tokens[0];
}

const NOTHING_LISTED: TokenInfosResult = { kind: 'resolved', malformed: 0, tokens: [] };

const REVALIDATE_S = 3600;

async function fetchTokenInfosFromJupiter({
    apiKey,
    mints,
    signal,
}: {
    apiKey: string;
    mints: string[];
    signal?: AbortSignal;
}): Promise<TokenInfosResult> {
    const url = new URL(JUPITER_TOKENS_SEARCH_URL);
    url.searchParams.set('query', mints.join(','));

    try {
        const response = await fetchUpstream(url.toString(), {
            headers: { Accept: 'application/json', 'x-api-key': apiKey },
            next: { revalidate: REVALIDATE_S },
            signal,
        });

        if (!response.ok) {
            const error = new TokenInfoHttpError({ status: response.status, statusText: response.statusText });
            return { error, kind: 'unavailable' };
        }

        const data: unknown = await response.json();
        if (!is(data, array())) return { error: new TokenInfoInvalidResponseError(), kind: 'unavailable' };

        return parseTokens(data, new Set(mints));
    } catch (error) {
        return { error, kind: 'unavailable' };
    }
}

type JupiterToken = Infer<typeof JupiterTokenStruct>;

function parseTokens(entries: unknown[], requested: ReadonlySet<string>): TokenInfosResult {
    const tokens: TokenInfo[] = [];
    let malformed = 0;
    for (const entry of entries) {
        if (!is(entry, JupiterTokenStruct)) {
            malformed++;
        } else if (requested.has(entry.id) && entry.name && entry.symbol) {
            tokens.push(toTokenInfo(entry));
        }
    }
    return { kind: 'resolved', malformed, tokens };
}

function toTokenInfo(token: JupiterToken): TokenInfo {
    return {
        address: token.id,
        // eslint-disable-next-line unicorn/no-null -- `TokenInfo` declares `decimals` and `logoURI` as `… | null`
        decimals: token.decimals ?? null,
        // eslint-disable-next-line unicorn/no-null -- same as above
        logoURI: token.icon ?? null,
        name: token.name,
        symbol: token.symbol,
        verified: token.isVerified === true,
    };
}
