'use client';

import { Cluster, type ClusterSelection, clusterUrl, type ServerCluster } from '@utils/cluster';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { parseRpcEndpoint, type RpcEndpoint } from '../lib/rpc-endpoint';

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

// Canonical, durable public clusters. Cluster.Simd296 is a temporary surfnet, so matches there aren't
// linkable later; Cluster.Custom is appended only when a usable custom RPC endpoint is configured.
const PUBLIC_CLUSTERS: ServerCluster[] = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet];
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
    // Parsed rather than passed through raw: a junk `?customUrl=` would otherwise add a Custom probe step
    // that shows "Searching Custom…" and never resolves.
    const customUrlParam = searchParams?.get('customUrl');
    const endpoint = useMemo(() => parseRpcEndpoint(customUrlParam), [customUrlParam]);

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
        const selections = getSelectionsToProbe(currentCluster, endpoint);

        async function searchClusters() {
            // Reset every output up front so a re-fired search never surfaces stale state, instead
            // of relying on React batching the synchronous setSearchingCluster below into the same flush.
            setStatus('searching');
            setSearchingCluster(undefined);
            setFoundCluster(undefined);

            for (const [index, selection] of selections.entries()) {
                if (isStale()) return;
                setSearchingCluster(selection.cluster);

                let found: boolean;
                try {
                    found = await probeRef.current(clusterUrl(selection), resourceId);
                } catch {
                    // Ignore probe errors (unreachable RPC, etc.) and try the next cluster
                    continue;
                }

                if (isStale()) return;

                if (found) {
                    setFoundCluster(selection.cluster);
                    setStatus('found');
                    return;
                }

                // Only pace between checks; skip the trailing delay so not-found shows immediately
                const isLastCluster = index === selections.length - 1;
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
    }, [resourceId, currentCluster, endpoint]);

    return { foundCluster, searchingCluster, status };
}

// Pairs, so the decision to probe Custom and the endpoint it is probed at cannot disagree.
function getSelectionsToProbe(currentCluster: Cluster, endpoint: RpcEndpoint | undefined): ClusterSelection[] {
    const selections: ClusterSelection[] = PUBLIC_CLUSTERS.filter(cluster => cluster !== currentCluster).map(
        cluster => ({ cluster }),
    );
    if (endpoint) {
        selections.push({ cluster: Cluster.Custom, endpoint });
    }
    return selections;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
