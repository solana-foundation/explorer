import { Cluster } from '@/app/utils/cluster';
import { FeatureInfoType } from '@/app/utils/feature-gate/types';

export function isFeatureActivated(feature: FeatureInfoType, cluster: Cluster) {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return feature.mainnet_activation_epoch !== null;
        case Cluster.Devnet:
            return feature.devnet_activation_epoch !== null;
        case Cluster.Testnet:
            return feature.testnet_activation_epoch !== null;
        default:
            return false;
    }
}
