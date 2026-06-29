import { Cluster } from '@/app/utils/cluster';

import { type UpcomingFeature } from './partition-features';

/**
 * Filter an upcoming features list to those relevant for the given cluster.
 * Pure — safe to call from a memo or outside of React.
 *
 * For MainnetBeta: features active on both devnet and testnet (battle-tested candidates).
 * For Devnet: features active on testnet but not yet on mainnet.
 * For Testnet: features not yet activated on testnet.
 */
export function filterUpcomingForCluster(features: UpcomingFeature[], cluster: Cluster): UpcomingFeature[] {
    return features.filter(feature => {
        switch (cluster) {
            case Cluster.MainnetBeta:
                return feature.devnet_activation_epoch !== null && feature.testnet_activation_epoch !== null;
            case Cluster.Devnet:
                return feature.testnet_activation_epoch !== null && !feature.mainnet_activation_epoch;
            case Cluster.Testnet:
                return feature.testnet_activation_epoch === null;
            default:
                return false;
        }
    });
}
