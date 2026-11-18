import { type GenesisHash, getChainId } from '@entities/chain-id/@x/token-info';
import { Cluster } from '@utils/cluster';

type SupportedCluster = Extract<Cluster, Cluster.Mainnet | Cluster.Testnet | Cluster.Devnet | Cluster.Custom>;

export function isValidCluster(value: unknown, genesisHash?: GenesisHash): value is SupportedCluster {
    return typeof value === 'number' && getChainId(value as Cluster, genesisHash) !== undefined;
}
