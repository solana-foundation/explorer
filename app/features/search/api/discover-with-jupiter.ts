import { array, boolean, is, nullable, number, optional, string, type } from 'superstruct';

import { matchAbortError } from '@/app/shared/lib/errors';
import { Logger } from '@/app/shared/lib/logger';

import { getJupiterApiKey } from '../config';
import type { DiscoveredToken, DiscoveryResult } from './types';

const JupiterTokenSchema = type({
    decimals: optional(number()),
    icon: optional(nullable(string())),
    id: string(),
    isVerified: optional(boolean()),
    logoURI: optional(nullable(string())),
    name: string(),
    symbol: string(),
});

const JupiterSearchResponseSchema = array(JupiterTokenSchema);

export async function discoverWithJupiter(query: string, signal: AbortSignal): Promise<DiscoveryResult> {
    const jupiterApiKey = getJupiterApiKey();
    if (!jupiterApiKey) {
        Logger.warn('[api:search] JUPITER_API_KEY is not configured — skipping Jupiter discovery');
        return { ok: false, tokens: [] };
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
            return { ok: false, tokens: [] };
        }

        const data = await response.json();
        if (!is(data, JupiterSearchResponseSchema)) {
            Logger.warn('[api:search] Jupiter schema mismatch', { sentry: true });
            return { ok: false, tokens: [] };
        }

        return {
            ok: true,
            tokens: data.map(item => ({
                address: item.id,
                decimals: item.decimals,
                isVerified: item.isVerified === true,
                logoUri: item.icon ?? item.logoURI ?? undefined,
                name: item.name,
                symbol: item.symbol,
            })),
        };
    } catch (error) {
        if (matchAbortError(error)) {
            // Fall through to UTL so any remaining discovery budget is used; the shared signal
            // may already be aborted, in which case UTL aborts quickly too (cheap CDN call).
            return { ok: false, tokens: [] };
        }
        Logger.error(error instanceof Error ? error : new Error('[api:search] Jupiter discovery failed'), {
            sentry: true,
        });
        return { ok: false, tokens: [] };
    }
}

const JUPITER_IMAGES_CACHE_REVALIDATE_S = 30;

// Fetches logo URIs for tokens whose discovery response didn't include one.
// Searches by symbol (not address) because Jupiter strips the logo field from address-based queries.
export async function fetchJupiterImages(tokens: DiscoveredToken[], signal: AbortSignal): Promise<Map<string, string>> {
    const jupiterApiKey = getJupiterApiKey();
    if (!jupiterApiKey) return new Map();

    const missing = tokens.filter(t => !t.logoUri);
    if (missing.length === 0) return new Map();

    const results = new Map<string, string>();

    const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) {
            reject(signal.reason);
        } else {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        }
    });

    await Promise.allSettled(
        missing.map(async token => {
            try {
                const url = `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(token.symbol)}`;
                const fetchPromise = fetch(url, {
                    headers: { Accept: 'application/json', 'x-api-key': jupiterApiKey },
                    next: { revalidate: JUPITER_IMAGES_CACHE_REVALIDATE_S },
                });
                const response = await Promise.race([fetchPromise, abortPromise]);
                if (!response.ok) {
                    Logger.warn(`[jupiter-images] ${response.status} for ${token.address}`);
                    return;
                }
                const data = await response.json();
                if (!is(data, JupiterSearchResponseSchema)) {
                    Logger.warn('[jupiter-images] schema mismatch');
                    return;
                }
                const match = data.find(t => t.id === token.address);
                const logo = match?.icon ?? match?.logoURI;
                if (logo) {
                    results.set(token.address, logo);
                } else if (!match) {
                    Logger.warn(`[jupiter-images] no match for ${token.symbol} in ${data.length} results`);
                }
            } catch (error) {
                if (!matchAbortError(error)) {
                    Logger.error(error instanceof Error ? error : new Error('[jupiter-images] fetch failed'), {
                        sentry: true,
                    });
                }
            }
        }),
    );

    return results;
}
