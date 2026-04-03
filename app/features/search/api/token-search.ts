/**
 * Token search via the Solana token-list API.
 *
 * @see https://token-list-api.solana.cloud
 * @see https://github.com/solflare-wallet/utl-api
 */

import { getChainId } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';
import { array, is, string, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import type { SearchItem } from '../lib/types';

const TokenSchema = type({
    address: string(),
    name: string(),
    symbol: string(),
});

const TokenSearchResponseSchema = type({
    content: array(TokenSchema),
});

export const TOKEN_SEARCH_API_URL = 'https://token-list-api.solana.cloud/v1/search';

const SEARCH_TIMEOUT_MS = 5_000;
const SEARCH_LIMIT = 20;

export async function searchTokens(query: string, cluster: Cluster): Promise<SearchItem[]> {
    if (process.env.NEXT_PUBLIC_DISABLE_TOKEN_SEARCH || !query) {
        return [];
    }

    const chainId = getChainId(cluster);
    if (chainId == undefined) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
        const url = new URL(TOKEN_SEARCH_API_URL);
        url.searchParams.set('query', query);
        url.searchParams.set('chainId', chainId.toString());
        url.searchParams.set('start', '0');
        url.searchParams.set('limit', SEARCH_LIMIT.toString());

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            Logger.error(new Error('Token search API error'), { chainId, query, status: response.status });
            return [];
        }

        const data = await response.json();

        if (!is(data, TokenSearchResponseSchema)) {
            Logger.error(new Error('Token search API response validation failed'), { chainId, query, sentry: true });
            return [];
        }

        return data.content.map(token => ({
            label: token.name,
            pathname: '/address/' + token.address,
            value: [token.name, token.symbol, token.address],
        }));
    } catch (error) {
        Logger.error(new Error('Token search request failed', { cause: error }), { chainId, query });
        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}
