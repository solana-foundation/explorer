'use client';

import { type ClusterResourceSearch, useClusterResourceSearch } from '@entities/cluster';
import { createSolanaRpc, signature as createSignature } from '@solana/kit';
import { Cluster } from '@utils/cluster';

/**
 * Probes the other public clusters (and an optional custom RPC) for a signature that was not found
 * on the current cluster. Thin wrapper over the shared {@link useClusterResourceSearch}.
 */
export function useClusterTransactionSearch(signature: string, currentCluster: Cluster): ClusterResourceSearch {
    return useClusterResourceSearch({ currentCluster, probe: probeSignature, resourceId: signature });
}

async function probeSignature(url: string, signature: string): Promise<boolean> {
    const rpc = createSolanaRpc(url);
    const { value } = await rpc
        .getSignatureStatuses([createSignature(signature)], { searchTransactionHistory: true })
        .send();

    // RPC returns literal null for missing signatures per JSON-RPC spec
    return value[0] !== null;
}
