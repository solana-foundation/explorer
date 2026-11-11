import 'server-only';

import { getChainId } from '@entities/chain-id/@x/token-info';
import { Cluster } from '@utils/cluster';
import { array, boolean, type Infer, is, nullable, number, optional, string, type } from 'superstruct';

import { UTL_API_BASE_URL } from '../env';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../lib/errors';
import { type FetchConfig, type TokenInfo } from '../lib/types';

/**
 * `decimals` and `logoURI` are optional as well as nullable: UTL omits the key
 * for some tokens, and a missing logo must not cost the whole token its name
 * and symbol.
 */
const UtlTokenStruct = type({
    address: string(),
    decimals: optional(nullable(number())),
    logoURI: optional(nullable(string())),
    name: string(),
    symbol: string(),
    verified: optional(boolean()),
});

type UtlToken = Infer<typeof UtlTokenStruct>;

function normalizeToken({ address, decimals, logoURI, name, symbol, verified }: UtlToken): TokenInfo {
    // eslint-disable-next-line unicorn/no-null -- `TokenInfo` declares `decimals` and `logoURI` as `… | null`
    return { address, decimals: decimals ?? null, logoURI: logoURI ?? null, name, symbol, verified: verified ?? false };
}

/** The response envelope. Entries stay `unknown` so one bad token can be dropped on its own. */
const MintsResponseStruct = type({ content: array() });

export async function getTokenInfos(
    addresses: string[],
    cluster: Cluster,
    genesisHash?: string,
    config?: FetchConfig,
): Promise<TokenInfo[]> {
    if (addresses.length === 0) return [];

    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return [];

    try {
        const response = await fetch(`${UTL_API_BASE_URL}/v1/mints?chainId=${chainId}`, {
            body: JSON.stringify({ addresses }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            next: config?.next,
            signal: config?.signal,
        });

        // checks for 200-299 range
        if (!response.ok) {
            config?.onError?.(new TokenInfoHttpError({ status: response.status, statusText: response.statusText }));
            return [];
        }

        const data = await response.json();

        if (!is(data, MintsResponseStruct)) {
            config?.onError?.(new TokenInfoInvalidResponseError());
            return [];
        }

        // Per token, not per batch: a single malformed entry must not blank every symbol in a
        // transaction. Drops are reported so upstream drift stays visible instead of silent.
        const tokens = data.content.filter(token => is(token, UtlTokenStruct)).map(normalizeToken);
        if (tokens.length !== data.content.length) {
            config?.onError?.(
                new TokenInfoInvalidResponseError(
                    `Invalid response: dropped ${data.content.length - tokens.length} of ${data.content.length} tokens`,
                ),
            );
        }

        return tokens;
    } catch (error) {
        config?.onError?.(error);
        return [];
    }
}

export async function getTokenInfo(
    address: string,
    cluster: Cluster,
    genesisHash?: string,
    config?: FetchConfig,
): Promise<TokenInfo | undefined> {
    const tokens = await getTokenInfos([address], cluster, genesisHash, config);
    return tokens[0];
}
