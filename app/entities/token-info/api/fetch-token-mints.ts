'use server';

import { getChainId } from '@entities/chain-id/@x/token-info';
import { Cluster } from '@utils/cluster';
import { array, boolean, type Infer, is, nullable, number, optional, string, type } from 'superstruct';

import { UTL_API_BASE_URL } from '../env';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../lib/errors';
import { type FetchConfig, type TokenInfo } from '../lib/types';

/**
 * The fields of a UTL `/v1/mints` token this app reads, with the types `TokenInfo`
 * declares. `type` ignores the rest (`chainId`, `tags`, `holders`, …), so an
 * upstream addition passes while a change to a rendered field does not.
 *
 * `decimals` and `logoURI` are optional as well as nullable: UTL omits the key
 * outright for some tokens, and a missing logo must not cost the whole token its
 * name and symbol. `normalizeToken` puts back the `null` `TokenInfo` declares.
 * `app/features/search/api/discover-with-utl.ts` reads the same API and treats
 * both fields the same way.
 */
const TokenInfoStruct = type({
    address: string(),
    decimals: optional(nullable(number())),
    logoURI: optional(nullable(string())),
    name: string(),
    symbol: string(),
    verified: optional(boolean()),
});

type UtlToken = Infer<typeof TokenInfoStruct>;

/**
 * Restores the keys UTL may omit to the `null` `TokenInfo` declares. Spreads the
 * token so the fields this app does not read (`tags`, `holders`, …) survive for
 * `getFullTokenInfo`, which merges them with the legacy CDN list.
 */
function normalizeToken(token: UtlToken): TokenInfo {
    // eslint-disable-next-line unicorn/no-null -- `decimals` and `logoURI` are `… | null` per the UTL contract
    return { ...token, decimals: token.decimals ?? null, logoURI: token.logoURI ?? null };
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
        const tokens = data.content
            .filter((token): token is UtlToken => is(token, TokenInfoStruct))
            .map(normalizeToken);
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
