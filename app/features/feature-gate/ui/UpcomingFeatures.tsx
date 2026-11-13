'use client';

import { cn } from '@components/shared/utils';
import { Cluster, clusterName } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import { useMemo } from 'react';

import { useCluster } from '@/app/providers/cluster';

import { filterUpcomingForCluster } from '../lib/filter-upcoming-features';
import { partitionFeatures, type UpcomingFeature } from '../lib/partition-features';
import { LINK_CLASS_NAME } from './ClusterEpoch';
import { FeatureGateTable, OtherActivationsCell } from './FeatureGateTable';

export function UpcomingFeatures() {
    const { cluster } = useCluster();
    const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
    const { upcoming } = useMemo(() => partitionFeatures(cluster), [cluster]);

    if (cluster === Cluster.Custom) {
        return undefined;
    }

    const features = filterUpcomingForCluster(upcoming, cluster);

    const header = (
        <div className="flex flex-col gap-1.5 border-0 border-b border-solid border-outer-space-800 px-3 py-3 md:flex-row md:items-baseline md:justify-between">
            <span className="font-medium text-white">
                <span className="mr-2">🚀</span>
                Upcoming {clusterName(cluster)} Features
            </span>
            <Link href={featureGatesPath} className={cn('text-sm', LINK_CLASS_NAME)}>
                View all feature gates
            </Link>
        </div>
    );

    // With nothing upcoming the block is left out.
    return (
        <FeatureGateTable<UpcomingFeature>
            features={features}
            cluster={cluster}
            secondColumn={{
                header: 'Activation',
                render: feature => <OtherActivationsCell activations={feature.otherActivations} />,
            }}
            header={header}
        />
    );
}
