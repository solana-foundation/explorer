import { Cluster } from '@utils/cluster';

// Genesis is deployed on mainnet and devnet; a custom URL may point at either or at a local validator.
const GENESIS_CLUSTERS = new Set([Cluster.MainnetBeta, Cluster.Devnet, Cluster.Custom]);

/** Whether the Genesis program can exist on `cluster`; elsewhere the lock lookup is not sent at all. */
export function isGenesisCluster(cluster: Cluster): boolean {
    return GENESIS_CLUSTERS.has(cluster);
}
