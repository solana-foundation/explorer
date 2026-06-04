'use client';

import { Cluster, clusterName, clusterSlug } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import { useMemo } from 'react';

import { useCluster } from '@/app/providers/cluster';

import { partitionFeatures, type UpcomingFeature } from '../lib/partition-features';
import { EmptyStateCard, FeatureGateTable } from './FeatureGateTable';

export function UpcomingFeatures() {
    const { cluster } = useCluster();
    const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
    const { upcoming } = useMemo(() => partitionFeatures(cluster), [cluster]);

    if (cluster === Cluster.Custom) {
        return undefined;
    }

    const features = upcoming.filter(feature => {
        switch (cluster) {
            case Cluster.MainnetBeta:
                return feature.devnet_activation_epoch !== null && feature.testnet_activation_epoch !== null;
            case Cluster.Devnet:
                return feature.testnet_activation_epoch !== null && !feature.mainnet_activation_epoch;
            case Cluster.Testnet:
                return !feature.mainnet_activation_epoch;
            default:
                return false;
        }
    });

    const header = (
        <div className="e-flex e-flex-col e-gap-1.5 e-border-b e-border-heavy-metal-950 e-px-4 e-py-3 md:e-flex-row md:e-items-center md:e-justify-between">
            <span className="e-font-medium e-text-dk-white">
                <span className="e-mr-2">🚀</span>
                Upcoming {clusterName(cluster)} Features
            </span>
            <Link
                href={featureGatesPath}
                className="e-text-dk-sm e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
            >
                View all feature gates
            </Link>
        </div>
    );

    return (
        <FeatureGateTable<UpcomingFeature>
            features={features}
            cluster={cluster}
            secondColumn={{
                header: 'Activation Epochs',
                render: feature => (
                    <div className="e-flex e-flex-col e-gap-0.5 e-whitespace-nowrap e-text-dk-sm">
                        {feature.otherActivations.map(({ cluster: c, epoch }) => (
                            <Link
                                key={c}
                                href={`/epoch/${epoch}?cluster=${clusterSlug(c)}`}
                                className="e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
                            >
                                {clusterName(c)}: {epoch}
                            </Link>
                        ))}
                    </div>
                ),
            }}
            emptyState={<EmptyStateCard>No upcoming features for {clusterName(cluster)}.</EmptyStateCard>}
            header={header}
        />
    );
}
