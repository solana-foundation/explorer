'use client';

import useSWRImmutable from 'swr/immutable';

import { fetchClusterInfo } from '../api/fetch-cluster-info';
import { ClusterStatus } from '../lib/cluster';
import type { ClusterInfo } from '../lib/types';
import { useCluster } from './use-cluster';

/** The cluster-info fetch as SWR reports it, so a consumer can tell "failed" from "not fetched yet". */
export type ClusterInfoResult = {
    data: ClusterInfo | undefined;
    error: unknown;
    isLoading: boolean;
};

/**
 * Lazily fetch live cluster info (epoch, schedule, first available block). Only fetches once the
 * cluster is connected and a consumer actually mounts this hook; SWR dedupes by URL so multiple
 * consumers share a single request. Pass `enabled: false` to defer the fetch (e.g. the always-mounted
 * search bar only needs it while a query is active).
 *
 * Returns the value alone, which collapses "not connected", "in flight" and "failed" into `undefined`.
 * Use `useClusterInfoResult` where those must be told apart — a consumer that hides itself when the
 * value is absent otherwise hides itself silently on a fetch error.
 */
export function useClusterInfo(options: { enabled?: boolean } = {}): ClusterInfo | undefined {
    return useClusterInfoResult(options).data;
}

/** `useClusterInfo` with the fetch state alongside the value. Shares its SWR entry, so it adds no request. */
export function useClusterInfoResult({ enabled = true }: { enabled?: boolean } = {}): ClusterInfoResult {
    const { url, status } = useCluster();
    const shouldFetch = enabled && status === ClusterStatus.Connected && Boolean(url);
    const { data, error, isLoading } = useSWRImmutable(
        shouldFetch ? ['cluster-info', url] : undefined,
        () => fetchClusterInfo(url),
        // Capped so `error` settles. Each retry yields a fresh Error identity, which re-fires consumers
        // keyed on it — unbounded, that is one report per attempt for as long as the page stays open.
        { errorRetryCount: 3 },
    );

    return { data, error, isLoading: shouldFetch && isLoading };
}
