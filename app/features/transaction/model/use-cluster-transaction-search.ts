'use client';

import { createSolanaRpc, signature as createSignature } from '@solana/kit';
import { Cluster, clusterUrl } from '@utils/cluster';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export type SearchStatus = 'idle' | 'searching' | 'found' | 'not-found';

export interface ClusterTransactionSearch {
    status: SearchStatus;
    searchingCluster: Cluster | undefined;
    foundCluster: Cluster | undefined;
}

// Canonical, durable public clusters. Cluster.Simd296 is a temporary surfnet, so matches there
// aren't linkable later; Cluster.Custom is appended only when a custom RPC URL is configured.
const PUBLIC_CLUSTERS = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet];
const PROBE_DELAY_MS = 700;

/**
 * Probes the other public clusters (and an optional custom RPC) for a signature that was not
 * found on the current cluster, reporting which cluster is being checked and where it was found.
 */
export function useClusterTransactionSearch(signature: string, currentCluster: Cluster): ClusterTransactionSearch {
    const searchParams = useSearchParams();
    const customUrl = searchParams?.get('customUrl');

    const [status, setStatus] = useState<SearchStatus>('idle');
    const [searchingCluster, setSearchingCluster] = useState<Cluster | undefined>(undefined);
    const [foundCluster, setFoundCluster] = useState<Cluster | undefined>(undefined);

    // Monotonic id used to cancel a search whose inputs changed before it finished.
    const searchIdRef = useRef(0);

    useEffect(() => {
        const searchId = ++searchIdRef.current;
        const isStale = () => searchIdRef.current !== searchId;
        const clusters = getClustersToProbe(currentCluster, customUrl);

        async function searchClusters() {
            setStatus('searching');
            setFoundCluster(undefined);

            for (const [index, cluster] of clusters.entries()) {
                if (isStale()) return;
                setSearchingCluster(cluster);

                let found: boolean;
                try {
                    found = await probeClusterForSignature(signature, cluster, customUrl);
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
    }, [signature, currentCluster, customUrl]);

    return { foundCluster, searchingCluster, status };
}

function getClustersToProbe(currentCluster: Cluster, customUrl: string | null | undefined): Cluster[] {
    const clusters = PUBLIC_CLUSTERS.filter(cluster => cluster !== currentCluster);
    if (customUrl) {
        clusters.push(Cluster.Custom);
    }
    return clusters;
}

async function probeClusterForSignature(
    signature: string,
    cluster: Cluster,
    customUrl: string | null | undefined,
): Promise<boolean> {
    const url = customUrl && cluster === Cluster.Custom ? customUrl : clusterUrl(cluster, '');
    const rpc = createSolanaRpc(url);
    const { value } = await rpc
        .getSignatureStatuses([createSignature(signature)], { searchTransactionHistory: true })
        .send();

    // RPC returns literal null for missing signatures per JSON-RPC spec
    return value[0] !== null;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
