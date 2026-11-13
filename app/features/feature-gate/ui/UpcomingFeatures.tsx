'use client';

import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
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

    // With nothing upcoming the block is left out, matching the Upcoming section of the feature gates page.
    if (features.length === 0) {
        return undefined;
    }

    return (
        // className="" drops the section's own card: FeatureGateTable brings its own surface.
        <CollapsibleSection
            title={`Upcoming ${clusterName(cluster)} Features`}
            actions={
                <Link href={featureGatesPath} className={cn('text-sm', LINK_CLASS_NAME)}>
                    View all feature gates
                </Link>
            }
            actionsLayout="wrap"
            collapsible={false}
            className=""
        >
            <FeatureGateTable<UpcomingFeature>
                features={features}
                cluster={cluster}
                secondColumn={{
                    header: 'Activation',
                    render: feature => <OtherActivationsCell activations={feature.otherActivations} />,
                }}
            />
        </CollapsibleSection>
    );
}
