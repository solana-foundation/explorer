import { Connection, type ParsedTransactionWithMeta } from '@solana/web3.js';

import { Cluster, clusterSlug, serverClusterUrl } from '@/app/utils/cluster';
import Logger from '@/app/utils/logger';

import { isClusterProbeEnabled } from '../env';
import { ReceiptError } from './errors';

// Clusters that can be probed when tx not found on mainnet
type ProbeCluster = Cluster.Devnet | Cluster.Testnet;
const CLUSTERS_TO_PROBE: ProbeCluster[] = [Cluster.Devnet, Cluster.Testnet];

export type ApiData = {
    cluster: Cluster;
    transaction: ParsedTransactionWithMeta;
};

export async function getTx(
    signature: string,
    dependencies?: {
        findCluster?: (signature: string) => Promise<Cluster | undefined>;
        fetchDetails?: (signature: string, rpcUrl: string) => Promise<ParsedTransactionWithMeta>;
    },
    cluster?: Cluster
): Promise<ApiData> {
    const findClusterFn = dependencies?.findCluster ?? findTransactionCluster;
    const fetchDetailsFn = dependencies?.fetchDetails ?? fetchTransactionDetails;

    // If cluster is provided, fetch directly without probing
    if (cluster !== undefined) {
        const rpcUrl = serverClusterUrl(cluster, '');
        const transaction = await fetchDetailsFn(signature, rpcUrl);
        return { cluster, transaction };
    }

    // No cluster specified - probe to find the transaction
    const foundCluster = await findClusterFn(signature);

    if (foundCluster === undefined) {
        Logger.warn(`Cluster not found for signature ${signature}`);
        throw new ReceiptError('Cluster not found', { status: 404 });
    }

    const rpcUrl = serverClusterUrl(foundCluster, '');
    const transaction = await fetchDetailsFn(signature, rpcUrl);

    if (!transaction) {
        throw new ReceiptError('Transaction not found', { status: 404 });
    }

    return { cluster: foundCluster, transaction };
}

async function findTransactionCluster(signature: string): Promise<Cluster | undefined> {
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
        Logger.info(`Transaction found on mainnet: ${signature}`);
        return Cluster.MainnetBeta;
    }

    // Skip probing other clusters if disabled
    if (!isClusterProbeEnabled) {
        Logger.info(`Cluster probing disabled, won't lookup for it at other cluster: ${signature}`);
        return undefined;
    } else {
        // Transaction not found on mainnet - probe other clusters
        Logger.warn(`Transaction not found on mainnet, probing other clusters: ${signature}`);
    }

    for (const cluster of CLUSTERS_TO_PROBE) {
        const result = await getSignatureStatus(signature, cluster);

        if ('left' in result) {
            Logger.error(result.left);
            throw new ReceiptError(`Failed to check the ${clusterSlug(cluster)}`, { cause: result.left, status: 502 });
        }

        if (result.right) {
            Logger.info(`Transaction found on ${cluster}: ${signature}`);
            return cluster;
        }
    }

    return undefined;
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
        Logger.error(error);
        return { left: error instanceof Error ? error : new Error(String(error)) };
    }
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
            throw new ReceiptError('Transaction not found', { status: 404 });
        }

        return transaction;
    } catch (error) {
        throw new ReceiptError('Failed to fetch transaction', { cause: error, status: 502 });
    }
}
