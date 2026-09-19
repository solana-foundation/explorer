import { createSolanaRpc, signature as createSignature } from '@solana/kit';
import { type ServerCluster, serverClusterUrl } from '@utils/cluster';

/**
 * Cluster result when a signature was found or not.
 */
export type FindTransactionClusterResult =
    | { cluster: ServerCluster; kind: 'found' }
    | { kind: 'not-found' }
    | { cluster: ServerCluster; error: Error; kind: 'error' };

/**
 * Walks `clusters` in order and stops at the first one holding the signature.
 *
 * Probe policy belongs to the caller: pass the clusters to try, in the order to try them.
 * @param clusters - Clusters to probe, in probe order
 * @param signature - The transaction signature to look for
 * @param options.abortSignal - Bounds the walk. Firing it ends the probe as an error, like any other fault
 */
export async function findTransactionCluster(
    clusters: readonly ServerCluster[],
    signature: string,
    options?: { abortSignal?: AbortSignal },
): Promise<FindTransactionClusterResult> {
    for (const cluster of clusters) {
        const status = await getSignatureStatus(cluster, signature, options?.abortSignal);

        if ('left' in status) return { cluster, error: status.left, kind: 'error' };
        if (status.right) return { cluster, kind: 'found' };
    }

    return { kind: 'not-found' };
}

type SignatureStatusResult = { left: Error } | { right: boolean };

async function getSignatureStatus(
    cluster: ServerCluster,
    signature: string,
    abortSignal?: AbortSignal,
): Promise<SignatureStatusResult> {
    try {
        const rpc = createSolanaRpc(serverClusterUrl(cluster));
        const { value } = await rpc
            .getSignatureStatuses([createSignature(signature)], { searchTransactionHistory: true })
            .send({ abortSignal });

        // The RPC returns literal null for a signature it does not hold, per the JSON-RPC spec.
        return { right: Boolean(value[0]) };
    } catch (error) {
        return { left: error instanceof Error ? error : new Error(String(error)) };
    }
}
