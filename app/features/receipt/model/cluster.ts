import { Cluster } from '@/app/utils/cluster';

// Clusters that can be specified via URL query param (non-mainnet)
export type QueryCluster = Cluster.Devnet | Cluster.Testnet | Cluster.Simd296;

export function parseClusterId(value: string | undefined): QueryCluster | undefined {
    if (value === undefined) return value;
    const id = Number(value);
    if (id === Cluster.Devnet || id === Cluster.Testnet || id === Cluster.Simd296) {
        return id;
    }
    return undefined;
}
