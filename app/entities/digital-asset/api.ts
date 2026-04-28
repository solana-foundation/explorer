/**
 * Optional Triton RPC enrichment for token icon metadata.
 *
 * Token discovery (Jupiter/UTL) does not always return icon URLs, so this
 * module fetches them from Triton's DAS API as a best-effort fallback.
 * If TRITON_RPC_URL is not configured, enrichment is silently skipped and
 * tokens are returned without icons.
 */

import fetch from 'node-fetch';
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

/**
 * Fetch metadata for multiple assets in one call.
 * Returns null if DAS is not configured or the request fails.
 */
export async function getAssetBatch(ids: string[], signal?: AbortSignal): Promise<DigitalAsset[] | null> {
    const url = process.env.TRITON_RPC_URL;
    if (!url) {
        Logger.warn('[digital-asset:triton] TRITON_RPC_URL is not configured — skipping enrichment');
        return null;
    }

    if (ids.length === 0) return [];

    try {
        const response = await fetch(url, {
            body: JSON.stringify({
                id: 'explorer-search',
                jsonrpc: '2.0',
                method: 'getAssets',
                params: { ids },
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal,
        });

        if (!response.ok) {
            Logger.warn(`[digital-asset:triton] getAssets returned ${response.status}`, { sentry: true });
            return null;
        }

        const data = await response.json();
        if (!is(data, GetAssetBatchResponseSchema)) {
            Logger.warn('[digital-asset:triton] getAssets invalid response', { sentry: true });
            return null;
        }

        return data.result as DigitalAsset[];
    } catch (error) {
        Logger.error(error instanceof Error ? error : new Error('[digital-asset:triton] getAssets failed'), {
            sentry: true,
        });
        return null;
    }
}
