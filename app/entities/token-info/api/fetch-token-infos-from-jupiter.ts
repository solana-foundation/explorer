import 'server-only';

import { getChainId } from '@entities/chain-id/@x/token-info';
import { chunk } from '@shared/lib/array';
import { Cluster } from '@utils/cluster';

import { TokenInfoInvalidResponseError } from '../lib/errors';
import { isRedactedTokenAddress } from '../lib/is-redacted-token-address';
import { jupiterListsTokensOn } from '../lib/jupiter-lists-tokens-on';
import { type JupiterToken } from '../lib/jupiter-token';
import { TOKEN_INFO_REQUEST_LIMIT } from '../lib/request-limit';
import { type TokenInfo } from '../lib/types';
import { searchJupiterTokens } from './search-jupiter-tokens';

export type TokenInfosResult =
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
    const result = await searchJupiterTokens({ apiKey, query: mints.join(','), revalidate: REVALIDATE_S, signal });
    if (result.kind === 'unavailable') return result;

    const requested = new Set(mints);
    const tokens = result.tokens
        .filter(token => requested.has(token.id) && token.name && token.symbol)
        .map(toTokenInfo);
    return { kind: 'resolved', malformed: result.malformed, tokens };
}

function toTokenInfo(token: JupiterToken): TokenInfo {
    const tokenInfo: TokenInfo = {
        address: token.id,
        // eslint-disable-next-line unicorn/no-null -- `TokenInfo` declares `decimals`, `logoURI`, `name` and `symbol` as `… | null`
        decimals: token.decimals ?? null,
        // eslint-disable-next-line unicorn/no-null -- same as above
        logoURI: token.icon ?? null,
        name: token.name,
        symbol: token.symbol,
        verified: token.isVerified === true,
    };
    return isRedactedTokenAddress(token.id) ? { ...tokenInfo, ...REDACTED_CONTENT } : tokenInfo;
}

// eslint-disable-next-line unicorn/no-null -- same as above
const REDACTED_CONTENT = { logoURI: null, name: null, symbol: null };
