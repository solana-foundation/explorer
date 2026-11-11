import { JUPITER_TOKENS_SEARCH_URL, JupiterTokenStruct } from '@entities/token-info/server';
import { array, is } from 'superstruct';

import { matchAbortError } from '@/app/shared/lib/errors';
import { fetchUpstream } from '@/app/shared/lib/http-utils';
import { Logger } from '@/app/shared/lib/logger';

import { getJupiterApiKey } from '../config';
import type { DiscoveredToken } from './types';

const JupiterSearchResponseSchema = array(JupiterTokenStruct);

export async function discoverWithJupiter(query: string, signal: AbortSignal): Promise<DiscoveredToken[]> {
    const jupiterApiKey = getJupiterApiKey();
    if (!jupiterApiKey) {
        Logger.warn('[api:search] JUPITER_API_KEY is not configured — skipping Jupiter discovery');
        return [];
    }

    try {
        const url = `${JUPITER_TOKENS_SEARCH_URL}?query=${encodeURIComponent(query)}`;
        const response = await fetchUpstream(url, {
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
            return [];
        }

        const data = await response.json();
        if (!is(data, JupiterSearchResponseSchema)) {
            Logger.warn('[api:search] Jupiter schema mismatch', { sentry: true });
            return [];
        }

        return data.map(item => ({
            address: item.id,
            decimals: item.decimals,
            isVerified: item.isVerified === true,
            logoUri: item.icon ?? undefined,
            name: item.name,
            symbol: item.symbol,
        }));
    } catch (error) {
        if (matchAbortError(error)) {
            return [];
        }
        Logger.error(error instanceof Error ? error : new Error('[api:search] Jupiter discovery failed'), {
            sentry: true,
        });
        return [];
    }
}
