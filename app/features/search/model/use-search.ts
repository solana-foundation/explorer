import { useCluster } from '@providers/cluster';
import useSWR from 'swr';

import { Logger } from '@/app/shared/lib/logger';

import type { SearchContext, SearchOptions, SearchProvider, SearchProviderRegistry } from '../lib/types';
import { searchProviders } from './registry';

export function useSearch(query: string) {
    const { cluster, clusterInfo } = useCluster();
    const trimmed = query.trim();

    return useSWR(
        trimmed.length > 0 ? ['search', trimmed, cluster] : null,
        () =>
            search(searchProviders, trimmed, {
                cluster,
                currentEpoch: clusterInfo?.epochInfo.epoch,
            }),
        {
            keepPreviousData: false,
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );
}

/**
 * Run all provider tiers and merge results.
 *
 * Remote providers start concurrently with local providers since they are
 * independent. Fallback providers only run when local returns nothing.
 */
export async function search(
    registry: SearchProviderRegistry,
    query: string,
    ctx: SearchContext,
): Promise<SearchOptions[]> {
    const { local, fallback, remote } = registry;

    // Kick off remote immediately — it doesn't depend on local results
    const remotePromise = resolveProviders(remote, query, ctx);

    const localResults = await resolveProviders(local, query, ctx);

    // If no local results, fall back to fallback providers
    const fallbackResults = localResults.length === 0 ? await resolveProviders(fallback, query, ctx) : [];

    const remoteResults = await remotePromise;

    return [...localResults, ...fallbackResults, ...remoteResults];
}

export async function resolveProviders(
    providers: SearchProvider[],
    query: string,
    ctx: SearchContext,
): Promise<SearchOptions[]> {
    const settled = await Promise.allSettled(providers.map(async p => p.search(query, ctx)));
    return settled.flatMap((result, i) => {
        if (result.status === 'rejected') {
            Logger.error(new Error(`Failed to run ${providers[i].name} search provider`, { cause: result.reason }));
            return [];
        }
        return result.value;
    });
}
