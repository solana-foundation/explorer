import fetch from 'node-fetch';
import { array, is, nullable, number, optional, string, type } from 'superstruct';

import { UTL_API_BASE_URL } from '@/app/entities/token-info/server';
import { matchAbortError } from '@/app/shared/lib/errors';
import { Logger } from '@/app/shared/lib/logger';

import type { DiscoveredToken } from './types';

const UtlTokenSchema = type({
    address: string(),
    decimals: optional(number()),
    logoURI: optional(nullable(string())),
    name: string(),
    symbol: string(),
});

const UtlSearchResponseSchema = type({
    content: array(UtlTokenSchema),
});

export async function discoverWithUtl(query: string, signal: AbortSignal, limit: number): Promise<DiscoveredToken[]> {
    try {
        const url = `${UTL_API_BASE_URL}/v1/search?query=${encodeURIComponent(query)}&chainId=101&limit=${limit}`;
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal,
        });

        if (!response.ok) {
            Logger.warn(`[api:search] UTL returned ${response.status}`, { sentry: true });
            return [];
        }

        const data = await response.json();
        if (!is(data, UtlSearchResponseSchema)) return [];

        return data.content.map(t => ({
            address: t.address,
            decimals: t.decimals,
            isVerified: false,
            logoUri: t.logoURI ?? undefined,
            name: t.name,
            symbol: t.symbol,
        }));
    } catch (error) {
        if (!matchAbortError(error)) {
            Logger.error(error instanceof Error ? error : new Error('[api:search] UTL fallback failed'), {
                sentry: true,
            });
        }
        return [];
    }
}
