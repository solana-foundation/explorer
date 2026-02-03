import { ChainId } from '@solflare-wallet/utl-sdk';
import { Cluster } from '@utils/cluster';

export function getChainId(cluster: Cluster.MainnetBeta | Cluster.Testnet | Cluster.Devnet): ChainId;
export function getChainId(cluster: Cluster.Simd296 | Cluster.Custom): undefined;
export function getChainId(cluster: Cluster): ChainId | undefined;
export function getChainId(cluster: Cluster): ChainId | undefined {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return ChainId.MAINNET;
        case Cluster.Testnet:
            return ChainId.TESTNET;
        case Cluster.Devnet:
            return ChainId.DEVNET;
        default:
            return undefined;
    }
}
