import { getChainId } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';

type SupportedCluster = Extract<
    Cluster,
    Cluster.MainnetBeta | Cluster.Testnet | Cluster.Devnet | Cluster.Simd296 | Cluster.Custom
>;

export function isValidCluster(value: unknown, genesisHash?: string): value is SupportedCluster {
    return typeof value === 'number' && getChainId(value as Cluster, genesisHash) !== undefined;
}
