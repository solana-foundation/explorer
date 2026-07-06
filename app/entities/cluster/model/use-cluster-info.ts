'use client';

import useSWRImmutable from 'swr/immutable';

import { fetchClusterInfo } from '../api/fetch-cluster-info';
import { ClusterStatus } from '../lib/cluster';
import type { ClusterInfo } from '../lib/types';
import { useCluster } from './use-cluster';

/**
 * Lazily fetch live cluster info (epoch, schedule, first available block). Only fetches once the
 * cluster is connected and a consumer actually mounts this hook; SWR dedupes by URL so multiple
 * consumers share a single request. Pass `enabled: false` to defer the fetch (e.g. the always-mounted
 * search bar only needs it while a query is active).
 */
export function useClusterInfo({ enabled = true }: { enabled?: boolean } = {}): ClusterInfo | undefined {
    const { url, status } = useCluster();
    const shouldFetch = enabled && status === ClusterStatus.Connected && Boolean(url);
    const { data } = useSWRImmutable(shouldFetch ? ['cluster-info', url] : undefined, () => fetchClusterInfo(url));
    return data;
}
