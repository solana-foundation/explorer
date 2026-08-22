'use client';

import { ClusterStatus } from '../lib/cluster';
import { useCluster } from './use-cluster';

/**
 * True when the connection health check failed. Every provider gates its fetch on a connected cluster,
 * so on failure nothing is ever requested and no fetch state arrives to end a loading card. Consumers
 * use this to report the failure the caller can already render — see `providers/cache-entry`.
 */
export function useClusterConnectionFailed(): boolean {
    const { status } = useCluster();
    return status === ClusterStatus.Failure;
}
