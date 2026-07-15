/**
 * DAS API enrichment for token icon metadata.
 *
 * Token discovery (Jupiter/UTL) does not always return icon URLs, so this
 * module fetches them from the cluster's DAS API as a best-effort fallback.
 */

import { validate } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { type DigitalAsset, GetAssetResponseSchema } from './types';

// How long to cache individual getAsset responses in Next.js Data Cache.
// Matches the search route's s-maxage so the full pipeline has consistent freshness.
const DAS_CACHE_REVALIDATE_S = 30;

async function fetchSingleAsset(id: string, url: string, signal?: AbortSignal): Promise<DigitalAsset | null> {
    // Do not pass `signal` directly to fetch — Next.js skips Data Cache for any
    // request that carries a signal. Check before and after instead: cached
    // responses return instantly so the enrichment budget is still respected.
    signal?.throwIfAborted();

    const response = await fetch(url, {
        body: JSON.stringify({
            id: 'explorer-das',
            jsonrpc: '2.0',
            method: 'getAsset',
            params: { id },
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        next: { revalidate: DAS_CACHE_REVALIDATE_S },
    });

    signal?.throwIfAborted();

    if (!response.ok) {
        Logger.warn(`[das] getAsset returned ${response.status}`, { sentry: true });
        return null;
    }

    const data = await response.json();

    if (data?.error) {
        Logger.warn(`[das] getAsset RPC error: ${data.error?.message ?? 'unknown'}`);
        return null;
    }

    const [validationError, validData] = validate(data, GetAssetResponseSchema);
    if (validationError) {
        Logger.warn(`[das] getAsset invalid response: ${validationError.message}`, { sentry: true });
        return null;
    }

    return validData.result;
}

/**
 * Fetch metadata for multiple assets via individual getAsset calls in parallel.
 * Returns undefined if url is empty or the request fails.
 */
export async function getAssetBatch(
    ids: string[],
    url: string,
    signal?: AbortSignal,
): Promise<DigitalAsset[] | undefined> {
    if (!url) {
        Logger.warn('[das] No RPC URL provided — skipping DAS enrichment');
        return undefined;
    }

    if (ids.length === 0) return [];

    try {
        const results = await Promise.all(ids.map(id => fetchSingleAsset(id, url, signal)));
        return results.filter((item): item is DigitalAsset => item !== null);
    } catch (error) {
        Logger.error(error instanceof Error ? error : new Error('[das] getAssetBatch failed'), {
            sentry: true,
        });
        return undefined;
    }
}
