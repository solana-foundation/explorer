import type { ScheduleCluster } from '@explorer/parsers/programs/compute-budget';
import { Cluster } from '@utils/cluster';

// The package keys its schedule by name rather than by the app's enum, so the two map here once.
const CLUSTER_NAMES: Record<Cluster, ScheduleCluster> = {
    [Cluster.Custom]: 'custom',
    [Cluster.Devnet]: 'devnet',
    [Cluster.MainnetBeta]: 'mainnet-beta',
    [Cluster.Testnet]: 'testnet',
};

export function toScheduleCluster(cluster: Cluster): ScheduleCluster {
    return CLUSTER_NAMES[cluster];
}
