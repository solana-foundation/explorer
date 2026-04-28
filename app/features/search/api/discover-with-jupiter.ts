import fetch from 'node-fetch';
import { array, boolean, is, nullable, number, optional, string, type } from 'superstruct';

import { matchAbortError } from '@/app/shared/lib/errors';
import { Logger } from '@/app/shared/lib/logger';

import { getJupiterApiKey } from '../config';
import type { DiscoveredToken } from './types';

const JupiterTokenSchema = type({
    decimals: optional(number()),
    id: string(),
    isVerified: optional(boolean()),
    logoURI: optional(nullable(string())),
    name: string(),
    symbol: string(),
});

const JupiterSearchResponseSchema = array(JupiterTokenSchema);

export async function discoverWithJupiter(query: string, signal: AbortSignal): Promise<DiscoveredToken[] | undefined> {
    const jupiterApiKey = getJupiterApiKey();
    if (!jupiterApiKey) {
        Logger.warn('[api:search] JUPITER_API_KEY is not configured — skipping Jupiter discovery');
        return undefined;
    }

    try {
        const url = `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'x-api-key': jupiterApiKey,
            },
            signal,
        });

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:search] Jupiter rate limit exceeded', { sentry: true });
            } else {
                Logger.warn(`[api:search] Jupiter returned ${response.status}`, { sentry: true });
            }
            return undefined;
        }

        const data = await response.json();
        if (!is(data, JupiterSearchResponseSchema)) return undefined;

        return data.map(item => ({
            address: item.id,
            decimals: item.decimals,
            isVerified: item.isVerified === true,
            logoUri: item.logoURI ?? undefined,
            name: item.name,
            symbol: item.symbol,
        }));
    } catch (error) {
        if (!matchAbortError(error)) {
            Logger.error(error instanceof Error ? error : new Error('[api:search] Jupiter discovery failed'), {
                sentry: true,
            });
        }
        return undefined;
    }
}
