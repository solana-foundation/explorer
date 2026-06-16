'use client';

import { Cluster, clusterName, clusterSlug } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import { useMemo } from 'react';

import { useCluster } from '@/app/providers/cluster';

import { filterUpcomingForCluster } from '../lib/filter-upcoming-features';
import { partitionFeatures, type UpcomingFeature } from '../lib/partition-features';
import { EmptyStateCard, FeatureGateTable } from './FeatureGateTable';

export function UpcomingFeatures() {
    const { cluster } = useCluster();
    const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
    const { upcoming } = useMemo(() => partitionFeatures(cluster), [cluster]);

    if (cluster === Cluster.Custom) {
        return undefined;
    }

    const features = filterUpcomingForCluster(upcoming, cluster);

    const header = (
        <div className="flex flex-col gap-1.5 border-b border-heavy-metal-950 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <span className="font-medium text-dk-white">
                <span className="mr-2">🚀</span>
                Upcoming {clusterName(cluster)} Features
            </span>
            <Link
                href={featureGatesPath}
                className="text-dk-sm text-dk-primary-dark hover:text-dk-primary-on-dark"
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
                    <div className="flex flex-col gap-0.5 whitespace-nowrap text-dk-sm">
                        {feature.otherActivations.map(({ cluster: c, epoch }) => (
                            <Link
                                key={c}
                                href={`/epoch/${epoch}?cluster=${clusterSlug(c)}`}
                                className="text-dk-primary-dark hover:text-dk-primary-on-dark"
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
