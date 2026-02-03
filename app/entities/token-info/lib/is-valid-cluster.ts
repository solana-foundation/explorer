import { Cluster } from '@utils/cluster';

import { getChainId } from './get-chain-id';

type SupportedCluster = Cluster.MainnetBeta | Cluster.Testnet | Cluster.Devnet;

export function isValidCluster(value: unknown): value is SupportedCluster {
    return typeof value === 'number' && getChainId(value as Cluster) !== undefined;
}
