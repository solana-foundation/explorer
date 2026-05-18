/**
 * DAS API enrichment for token icon metadata.
 *
 * Token discovery (Jupiter/UTL) does not always return icon URLs, so this
 * module fetches them from the cluster's DAS API as a best-effort fallback.
 */

import { array, boolean, is, optional, string, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import type { DigitalAsset } from './types';

const DigitalAssetSchema = type({
    burnt: boolean(),
    content: type({
        $schema: string(),
        json_uri: string(),
        links: optional(
            type({
                external_url: optional(string()),
                image: optional(string()),
            }),
        ),
        metadata: type({}),
    }),
    id: string(),
    interface: string(),
    mutable: boolean(),
});

const GetAssetBatchResponseSchema = type({
    result: array(DigitalAssetSchema),
});

// How long to cache individual getAssets responses in Next.js Data Cache.
// Matches the search route's s-maxage so the full pipeline has consistent freshness.
const DAS_CACHE_REVALIDATE_S = 30;

/**
 * Fetch metadata for multiple assets in one call.
 * Returns null if url is empty or the request fails.
 */
export async function getAssetBatch(ids: string[], url: string, signal?: AbortSignal): Promise<DigitalAsset[] | null> {
    if (!url) {
        Logger.warn('[das] No RPC URL provided — skipping DAS enrichment');
        return null;
    }

    if (ids.length === 0) return [];

    try {
        // Do not pass `signal` directly to fetch — Next.js skips Data Cache for any
        // request that carries a signal. Instead, race the fetch against a manual
        // abort promise so the 2 s enrichment budget is still enforced while cached
        // responses (which return instantly) are never affected by the signal at all.
        const fetchPromise = fetch(url, {
            body: JSON.stringify({
                id: 'explorer-search',
                jsonrpc: '2.0',
                method: 'getAssets',
                params: { ids },
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            next: { revalidate: DAS_CACHE_REVALIDATE_S },
        });

        const abortPromise = signal
            ? new Promise<never>((_, reject) => {
                  if (signal.aborted) {
                      reject(signal.reason);
                  } else {
                      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
                  }
              })
            : null;

        const response = await (abortPromise ? Promise.race([fetchPromise, abortPromise]) : fetchPromise);

        if (!response.ok) {
            Logger.warn(`[das] getAssets returned ${response.status}`, { sentry: true });
            return null;
        }

        const data = await response.json();

        Logger.info('[das] getAssets response', { data });

        if (!is(data, GetAssetBatchResponseSchema)) {
            Logger.warn('[das] getAssets invalid response', { sentry: true });
            return null;
        }

        return data.result as DigitalAsset[];
    } catch (error) {
        Logger.error(error instanceof Error ? error : new Error('[das] getAssets failed'), {
            sentry: true,
        });
        return null;
    }
}
