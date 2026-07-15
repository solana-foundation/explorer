'use client';

import { Cluster, clusterUrl } from '@utils/cluster';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export type ClusterSearchStatus = 'idle' | 'searching' | 'found' | 'not-found';

export interface ClusterResourceSearch {
    status: ClusterSearchStatus;
    searchingCluster: Cluster | undefined;
    foundCluster: Cluster | undefined;
}

/**
 * Probes a single cluster (reachable at `url`) for `resourceId`, resolving to whether it exists
 * there. Implementations differ only in the RPC call — e.g. getAccountInfo vs getSignatureStatuses.
 */
export type ClusterResourceProbe = (url: string, resourceId: string) => Promise<boolean>;

// Canonical, durable public clusters. Cluster.Simd296 is a temporary surfnet, so matches there
// aren't linkable later; Cluster.Custom is appended only when a custom RPC URL is configured.
const PUBLIC_CLUSTERS = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet];
const PROBE_DELAY_MS = 700;

/**
 * Sequentially probes the other public clusters (and an optional custom RPC) for a resource that
 * was not found on the current cluster, reporting which cluster is being checked and where it was
 * found. Shared by the transaction and account "not found" cards; callers inject the `probe`.
 */
export function useClusterResourceSearch({
    resourceId,
    currentCluster,
    probe,
}: {
    resourceId: string;
    currentCluster: Cluster;
    probe: ClusterResourceProbe;
}): ClusterResourceSearch {
    const searchParams = useSearchParams();
    const customUrl = searchParams?.get('customUrl');

    const [status, setStatus] = useState<ClusterSearchStatus>('idle');
    const [searchingCluster, setSearchingCluster] = useState<Cluster | undefined>(undefined);
    const [foundCluster, setFoundCluster] = useState<Cluster | undefined>(undefined);

    // Monotonic id used to cancel a search whose inputs changed before it finished.
    const searchIdRef = useRef(0);
    // Track the latest probe without making it an effect dependency, so callers can pass an inline
    // function without restarting the search on every render.
    const probeRef = useRef(probe);
    probeRef.current = probe;

    useEffect(() => {
        const searchId = ++searchIdRef.current;
        const isStale = () => searchIdRef.current !== searchId;
        const clusters = getClustersToProbe(currentCluster, customUrl);

        async function searchClusters() {
            // Reset every output up front so a re-fired search never surfaces stale state, instead
            // of relying on React batching the synchronous setSearchingCluster below into the same flush.
            setStatus('searching');
            setSearchingCluster(undefined);
            setFoundCluster(undefined);

            for (const [index, cluster] of clusters.entries()) {
                if (isStale()) return;
                setSearchingCluster(cluster);

                let found: boolean;
                try {
                    found = await probeRef.current(resolveClusterUrl(cluster, customUrl), resourceId);
                } catch {
                    // Ignore probe errors (unreachable RPC, etc.) and try the next cluster
                    continue;
                }

                if (isStale()) return;

                if (found) {
                    setFoundCluster(cluster);
                    setStatus('found');
                    return;
                }

                // Only pace between checks; skip the trailing delay so not-found shows immediately
                const isLastCluster = index === clusters.length - 1;
                if (!isLastCluster) await sleep(PROBE_DELAY_MS);
            }

            if (isStale()) return;
            setStatus('not-found');
            setSearchingCluster(undefined);
        }

        searchClusters();

        return () => {
            // Invalidate this run so an in-flight probe cannot commit stale state after cleanup.
            if (!isStale()) searchIdRef.current += 1;
        };
    }, [resourceId, currentCluster, customUrl]);

    return { foundCluster, searchingCluster, status };
}

function getClustersToProbe(currentCluster: Cluster, customUrl: string | null | undefined): Cluster[] {
    const clusters = PUBLIC_CLUSTERS.filter(cluster => cluster !== currentCluster);
    if (customUrl) {
        clusters.push(Cluster.Custom);
    }
    return clusters;
}

function resolveClusterUrl(cluster: Cluster, customUrl: string | null | undefined): string {
    // clusterUrl has no entry for a custom RPC, so resolve the custom URL explicitly.
    if (customUrl && cluster === Cluster.Custom) {
        return customUrl;
    }
    return clusterUrl(cluster, '');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
