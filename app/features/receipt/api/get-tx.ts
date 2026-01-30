import { Connection, type ParsedTransactionWithMeta } from '@solana/web3.js';

import { Cluster, serverClusterUrl } from '@/app/utils/cluster';

// Clusters to probe when transaction is not found on mainnet
const CLUSTERS_TO_PROBE: Cluster[] = [Cluster.Devnet, Cluster.Testnet];

export type ApiData = {
    cluster: Cluster;
    transaction: ParsedTransactionWithMeta;
};

export async function getTx(
    signature: string,
    dependencies?: {
        findCluster?: (signature: string) => Promise<Cluster | undefined>;
        fetchDetails?: (signature: string, rpcUrl: string) => Promise<ParsedTransactionWithMeta>;
    }
): Promise<ApiData> {
    const findClusterFn = dependencies?.findCluster ?? findTransactionCluster;
    const fetchDetailsFn = dependencies?.fetchDetails ?? fetchTransactionDetails;

    const cluster = await findClusterFn(signature);

    if (cluster === undefined) {
        throw new Error('Cluster not found');
    }

    const rpcUrl = serverClusterUrl(cluster, '');
    const transaction = await fetchDetailsFn(signature, rpcUrl);

    if (!transaction) {
        throw new Error('Transaction not found');
    }

    return { cluster, transaction };
}

type SignatureStatusResult = { left: Error } | { right: boolean };

async function getSignatureStatus(signature: string, cluster: Cluster): Promise<SignatureStatusResult> {
    const rpcUrl = serverClusterUrl(cluster, '');
    const connection = new Connection(rpcUrl, 'confirmed');

    try {
        const status = await connection.getSignatureStatus(signature, {
            searchTransactionHistory: true,
        });
        return { right: status?.value !== null };
    } catch (error) {
        return { left: error instanceof Error ? error : new Error(String(error)) };
    }
}

async function findTransactionCluster(signature: string): Promise<Cluster | undefined> {
    const mainnetResult = await getSignatureStatus(signature, Cluster.MainnetBeta);

    // Fail on mainnet network error - don't silently probe other clusters
    if ('left' in mainnetResult) {
        throw new Error('Failed to check mainnet', { cause: mainnetResult.left });
    }

    if (mainnetResult.right) {
        return Cluster.MainnetBeta;
    }

    // Transaction not found on mainnet - probe other clusters
    for (const cluster of CLUSTERS_TO_PROBE) {
        const result = await getSignatureStatus(signature, cluster);

        if ('left' in result) {
            throw new Error(`Failed to check cluster ${cluster}`, { cause: result.left });
        }

        if (result.right) {
            return cluster;
        }
    }

    return undefined;
}

async function fetchTransactionDetails(signature: string, rpcUrl: string): Promise<ParsedTransactionWithMeta> {
    const rpcRequestConfig = {
        maxSupportedTransactionVersion: 0,
    };
    const connection = new Connection(rpcUrl, 'confirmed');

    try {
        const transaction = await connection.getParsedTransaction(signature, {
            ...rpcRequestConfig,
            commitment: 'confirmed',
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return transaction;
    } catch (error) {
        throw new Error('Failed to fetch transaction', { cause: error });
    }
}
