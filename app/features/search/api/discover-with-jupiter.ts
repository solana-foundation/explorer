import { JupiterHttpError, reportJupiterError, searchJupiterTokens } from '@entities/token-info/server';

import { matchAbortError } from '@/app/shared/lib/errors';
import { Logger } from '@/app/shared/lib/logger';

import { getJupiterApiKey } from '../config';
import type { DiscoveredToken } from './types';

export async function discoverWithJupiter(query: string, signal: AbortSignal): Promise<DiscoveredToken[]> {
    const jupiterApiKey = getJupiterApiKey();
    if (!jupiterApiKey) {
        Logger.warn('[api:search] JUPITER_API_KEY is not configured — skipping Jupiter discovery');
        return [];
    }

    const result = await searchJupiterTokens({ apiKey: jupiterApiKey, query, signal });
    if (result.kind === 'rate-limited') {
        Logger.warn('[api:search] Jupiter rate limit exceeded', { sentry: true });
        return [];
    }
    if (result.kind === 'unavailable') {
        reportUnavailable(result.error);
        return [];
    }
    return result.tokens.map(item => ({
        address: item.id,
        decimals: item.decimals,
        isVerified: item.isVerified === true,
        logoUri: item.icon ?? undefined,
        name: item.name,
        symbol: item.symbol,
    }));
}

function reportUnavailable(error: unknown): void {
    if (matchAbortError(error)) return;
    // A 403 refuses the query text, so any visitor can cause one from the search box.
    if (error instanceof JupiterHttpError && error.status === 403) {
        Logger.warn('[api:search] Jupiter returned 403', { sentry: true });
        return;
    }
    reportJupiterError({ error, message: '[api:search] Jupiter discovery failed' });
}
