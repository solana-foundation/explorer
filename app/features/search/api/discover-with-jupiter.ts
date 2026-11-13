import { searchJupiterTokens, TokenInfoHttpError, TokenInfoInvalidResponseError } from '@entities/token-info/server';

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
    if (result.kind === 'unavailable') {
        reportUnavailable(result.error);
        return [];
    }
    if (result.malformed > 0) {
        warnSchemaMismatch();
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
    if (error instanceof TokenInfoHttpError) {
        if (error.status === 429) {
            Logger.warn('[api:search] Jupiter rate limit exceeded', { sentry: true });
        } else {
            Logger.warn(`[api:search] Jupiter returned ${error.status}`, { sentry: true });
        }
        return;
    }
    if (error instanceof TokenInfoInvalidResponseError) {
        warnSchemaMismatch();
        return;
    }
    if (matchAbortError(error)) return;
    Logger.error(error instanceof Error ? error : new Error('[api:search] Jupiter discovery failed'), {
        sentry: true,
    });
}

function warnSchemaMismatch(): void {
    Logger.warn('[api:search] Jupiter schema mismatch', { sentry: true });
}
