import { fetchTransactionDetails, type TransactionWithMeta } from '@entities/transaction-data';
import { createSolanaRpc, signature as createSignature } from '@solana/kit';

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
    const findClusterFn = dependencies?.findCluster ?? findTransactionCluster;
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

async function findTransactionCluster(signature: string): Promise<ServerCluster | undefined> {
    const mainnetResult = await getSignatureStatus(signature, Cluster.MainnetBeta);

    // Fail on mainnet network error - don't silently probe other clusters
    if ('left' in mainnetResult) {
        Logger.error(mainnetResult.left);
        throw new ReceiptError(`Failed to check the ${clusterSlug(Cluster.MainnetBeta)}`, {
            cause: mainnetResult.left,
            status: 502,
        });
    }

    if (mainnetResult.right) {
        Logger.info('[receipt] Transaction found on mainnet', { signature });
        return Cluster.MainnetBeta;
    }

    // Skip probing other clusters if disabled
    if (!isClusterProbeEnabled) {
        Logger.info('[receipt] Cluster probing disabled, skipping other clusters', { signature });
        return undefined;
    } else {
        // Transaction not found on mainnet - probe other clusters
        Logger.warn('[receipt] Transaction not found on mainnet, probing other clusters', { signature });
    }

    for (const cluster of CLUSTERS_TO_PROBE) {
        const result = await getSignatureStatus(signature, cluster);

        if ('left' in result) {
            Logger.error(result.left, { cluster });
            throw new ReceiptError(`Failed to check the ${clusterSlug(cluster)}`, { cause: result.left, status: 502 });
        }

        if (result.right) {
            Logger.info('[receipt] Transaction found on cluster', { cluster, signature });
            return cluster;
        }
    }

    return undefined;
}

type SignatureStatusResult = { left: Error } | { right: boolean };

async function getSignatureStatus(signature: string, cluster: ServerCluster): Promise<SignatureStatusResult> {
    const rpcUrl = serverClusterUrl(cluster);
    const rpc = createSolanaRpc(rpcUrl);

    try {
        const { value } = await rpc
            .getSignatureStatuses([createSignature(signature)], { searchTransactionHistory: true })
            .send();
        return { right: Boolean(value[0]) };
    } catch (error) {
        Logger.error(error, { cluster, signature });
        return { left: error instanceof Error ? error : new Error(String(error)) };
    }
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
