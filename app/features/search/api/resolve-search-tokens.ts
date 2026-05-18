import { getAssetBatch } from '@/app/entities/digital-asset/server';
import { type Cluster, serverClusterUrl } from '@/app/utils/cluster';

import { getJupiterApiKey } from '../config';
import { discoverWithJupiter, fetchJupiterImages } from './discover-with-jupiter';
import { discoverWithUtl } from './discover-with-utl';
import type { DiscoveredToken } from './types';

const SEARCH_CACHE_REVALIDATE_S = 30;
const DISCOVERY_TIMEOUT_MS = 3_000;
const ENRICHMENT_TIMEOUT_MS = 2_000;
const IMAGE_FALLBACK_TIMEOUT_MS = 2_000;
const SEARCH_TOKENS_LIMIT = 20;

export const SEARCH_CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${SEARCH_CACHE_REVALIDATE_S}, stale-while-revalidate=${SEARCH_CACHE_REVALIDATE_S * 2}`,
};

type NormalizedToken = {
    decimals: number | undefined;
    icon: string | undefined;
    isVerified: boolean;
    name: string;
    ticker: string;
    tokenAddress: string;
};

export async function resolveSearchTokens(query: string, cluster: Cluster, customUrl = ''): Promise<NormalizedToken[]> {
    // --- Discovery (3s budget) ---
    const discoveryController = new AbortController();
    const discoveryTimeout = setTimeout(() => discoveryController.abort(), DISCOVERY_TIMEOUT_MS);

    let discovered: DiscoveredToken[];
    try {
        discovered = getJupiterApiKey()
            ? (await discoverWithJupiter(query, discoveryController.signal)).slice(0, SEARCH_TOKENS_LIMIT)
            : // Jupiter unavailable — fall back to UTL (degraded: no address search, curated list only)
              await discoverWithUtl(query, discoveryController.signal, SEARCH_TOKENS_LIMIT);
    } finally {
        clearTimeout(discoveryTimeout);
    }

    if (discovered.length === 0) return [];

    // --- Enrichment + Jupiter image fallback in parallel (2s budget each) ---
    const enrichmentController = new AbortController();
    const enrichmentTimeout = setTimeout(() => enrichmentController.abort(), ENRICHMENT_TIMEOUT_MS);

    const imageController = new AbortController();
    const imageTimeout = setTimeout(() => imageController.abort(), IMAGE_FALLBACK_TIMEOUT_MS);

    const rpcUrl = serverClusterUrl(cluster, customUrl);
    const addresses = discovered.map(t => t.address);

    let assets = null;
    let jupiterIconMap = new Map<string, string>();
    try {
        [assets, jupiterIconMap] = await Promise.all([
            getAssetBatch(addresses, rpcUrl, enrichmentController.signal),
            fetchJupiterImages(discovered, imageController.signal),
        ]);
    } finally {
        clearTimeout(enrichmentTimeout);
        clearTimeout(imageTimeout);
    }

    const iconMap = new Map(assets?.map(a => [a.id, a.content.links?.image]) ?? []);

    return discovered.map(t => ({
        decimals: t.decimals,
        icon: t.logoUri ?? iconMap.get(t.address) ?? jupiterIconMap.get(t.address),
        isVerified: t.isVerified,
        name: t.name,
        ticker: t.symbol,
        tokenAddress: t.address,
    }));
}
