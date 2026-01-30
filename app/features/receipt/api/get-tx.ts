import { Connection, type ParsedTransactionWithMeta } from '@solana/web3.js';

import { Cluster, serverClusterUrl } from '@/app/utils/cluster';

const CLUSTERS_TO_TRY: Cluster[] = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet];

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

async function findTransactionCluster(signature: string): Promise<Cluster | undefined> {
    for (const cluster of CLUSTERS_TO_TRY) {
        const rpcUrl = serverClusterUrl(cluster, '');
        const connection = new Connection(rpcUrl, 'confirmed');

        try {
            const status = await connection.getSignatureStatus(signature, {
                searchTransactionHistory: true,
            });
            if (status?.value !== null) {
                return cluster;
            }
        } catch (error) {
            console.error('Failed to find transaction cluster', error);
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
