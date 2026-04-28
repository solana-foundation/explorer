import { clusterSlug } from '@utils/cluster';
import { array, boolean, is, nullable, number, optional, string, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchContext, SearchOptions } from '../lib/types';

const TokenSearchResultSchema = type({
    decimals: optional(number()),
    icon: optional(nullable(string())),
    isVerified: boolean(),
    name: string(),
    ticker: string(),
    tokenAddress: string(),
});

const SearchApiResponseSchema = type({
    results: type({
        tokens: array(TokenSearchResultSchema),
    }),
    success: boolean(),
});

export async function fetchTokenResults(query: string, ctx: SearchContext): Promise<SearchOptions[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
        const params = new URLSearchParams({
            cluster: clusterSlug(ctx.cluster),
            q: trimmed,
        });

        const response = await fetch(`/api/search?${params}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        });

        if (!response.ok) {
            Logger.warn('[token-search] search error', {
                query: trimmed,
                status: response.status.toString(),
            });
            return [];
        }

        const data = await response.json();
        if (!is(data, SearchApiResponseSchema)) {
            Logger.error(new Error('[token-search] invalid search response'), { query: trimmed });
            return [];
        }

        const tokens = data.results.tokens;
        const options = tokens.map(t => ({
            icon: t.icon ?? undefined,
            label: `${t.ticker} - ${t.name}`,
            pathname: `/address/${t.tokenAddress}`,
            sublabel: t.tokenAddress,
            type: 'address',
            value: [t.name, t.ticker, t.tokenAddress],
            verified: t.isVerified,
        }));
        return options.length > 0 ? [{ label: SearchGroup.Tokens, options }] : [];
    } catch (error) {
        Logger.error(error instanceof Error ? error : new Error('[token-search] request failed'), { query: trimmed });
        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}
