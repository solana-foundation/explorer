import { fetchTransactionDetails, type TransactionWithMeta } from '@entities/transaction-data';
import { findTransactionCluster } from '@entities/transaction-data/server';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster, clusterSlug, type ServerCluster, serverClusterUrl } from '@/app/utils/cluster';

import { isClusterProbeEnabled } from '../env';
import { ReceiptError } from './errors';

// Clusters that can be probed when tx not found on mainnet
type ProbeCluster = Cluster.Devnet | Cluster.Testnet;
const CLUSTERS_TO_PROBE: ProbeCluster[] = [Cluster.Devnet, Cluster.Testnet];

export type ApiData = {
    cluster: Cluster;
    transaction: TransactionWithMeta;
};

export async function getTx(
    signature: string,
    dependencies?: {
        findCluster?: (signature: string) => Promise<ServerCluster | undefined>;
        fetchDetails?: (signature: string, rpcUrl: string) => Promise<TransactionWithMeta>;
    },
    cluster?: ServerCluster,
): Promise<ApiData> {
    const findClusterFn = dependencies?.findCluster ?? findClusterOrThrow;
    const fetchDetailsFn = dependencies?.fetchDetails ?? fetchReceiptTransaction;

    // If cluster is provided, fetch directly without probing
    if (cluster !== undefined) {
        const rpcUrl = serverClusterUrl(cluster);
        const transaction = await fetchDetailsFn(signature, rpcUrl);
        return { cluster, transaction };
    }

    // No cluster specified - probe to find the transaction
    const foundCluster = await findClusterFn(signature);

    if (foundCluster === undefined) {
        Logger.warn('[receipt] Cluster not found for signature', { signature });
        throw new ReceiptError('Cluster not found', { status: 404 });
    }

    const rpcUrl = serverClusterUrl(foundCluster);
    const transaction = await fetchDetailsFn(signature, rpcUrl);

    if (!transaction) {
        throw new ReceiptError('Transaction not found', { status: 404 });
    }

    return { cluster: foundCluster, transaction };
}

/**
 * Receipt's mapping of the entity probe onto its own error type.
 */
async function findClusterOrThrow(signature: string): Promise<ServerCluster | undefined> {
    const clusters: ServerCluster[] = isClusterProbeEnabled
        ? [Cluster.MainnetBeta, ...CLUSTERS_TO_PROBE]
        : [Cluster.MainnetBeta];

    const result = await findTransactionCluster(clusters, signature);

    if (result.kind === 'error') {
        // Fail rather than treating a network fault as "not on this cluster" and probing on.
        Logger.error(result.error, { cluster: result.cluster });
        throw new ReceiptError(`Failed to check the ${clusterSlug(result.cluster)}`, {
            cause: result.error,
            status: 502,
        });
    }

    if (result.kind === 'found') {
        Logger.info('[receipt] Transaction found on cluster', { cluster: result.cluster, signature });
        return result.cluster;
    }

    Logger.info('[receipt] Transaction not found on any probed cluster', { clusters, signature });
    return undefined;
}

async function fetchReceiptTransaction(signature: string, rpcUrl: string): Promise<TransactionWithMeta> {
    try {
        const transaction = await fetchTransactionDetails(rpcUrl, signature);

        if (!transaction) {
            throw new ReceiptError('Transaction not found', { status: 404 });
        }

        return transaction;
    } catch (error) {
        throw new ReceiptError('Failed to fetch transaction', { cause: error, status: 502 });
    }
}
