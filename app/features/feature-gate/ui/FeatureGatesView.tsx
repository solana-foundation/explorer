'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/shared/ui/tabs';
import { useCluster } from '@/app/providers/cluster';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { Cluster, clusterName, clusterSlug } from '@/app/utils/cluster';

import { estimateTimeUntilEpoch } from '../lib/epoch-countdown';
import {
    type ActivatedFeature,
    type ClusterActivation,
    partitionFeatures,
    type UpcomingFeature,
} from '../lib/partition-features';
import { EmptyStateCard, FeatureGateTable } from './FeatureGateTable';

type TabValue = 'activated' | 'upcoming';

type EpochScheduleInfo = {
    currentEpoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
    slotsPerEpoch: bigint;
};

export function FeatureGatesView() {
    const { cluster, clusterInfo } = useCluster();
    const { activated, upcoming } = useMemo(() => partitionFeatures(cluster), [cluster]);
    const [tab, setTab] = useState<TabValue>('activated');

    if (cluster === Cluster.Custom) {
        return (
            <div className="e-mx-auto e-max-w-screen-xl e-px-4 e-py-4">
                <h1 className="e-mb-4 e-text-2xl e-font-semibold e-text-dk-white">Feature Gates</h1>
                <Card variant="tight">
                    <CardHeader>
                        <CardTitle>Custom cluster</CardTitle>
                    </CardHeader>
                    <CardContent className="e-text-sm e-text-dk-gray-300">
                        Enumeration of feature gates is not available on a custom cluster.
                    </CardContent>
                </Card>
            </div>
        );
    }

    const epochScheduleInfo: EpochScheduleInfo | undefined = clusterInfo
        ? {
              currentEpoch: clusterInfo.epochInfo.epoch,
              slotIndex: clusterInfo.epochInfo.slotIndex,
              slotsInEpoch: clusterInfo.epochInfo.slotsInEpoch,
              slotsPerEpoch: clusterInfo.epochSchedule.slotsPerEpoch,
          }
        : undefined;

    return (
        <div className="e-mx-auto e-max-w-screen-xl e-px-4 e-py-4">
            <div className="e-mb-4 e-flex e-items-baseline e-gap-3">
                <h1 className="e-text-2xl e-font-semibold e-text-dk-white">Feature Gates</h1>
                <span className="e-text-sm e-text-dk-gray-400">{clusterName(cluster)}</span>
            </div>

            <Tabs value={tab} onValueChange={value => setTab(value as TabValue)}>
                <TabsList className="e-mb-4 e-gap-6 e-border-b e-border-heavy-metal-950">
                    <TabsTrigger value="activated" className="e-flex e-items-center e-gap-2">
                        Activated
                        <Badge variant="secondary" size="xs">
                            {activated.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="e-flex e-items-center e-gap-2">
                        Upcoming
                        <Badge variant={upcoming.length > 0 ? 'info' : 'secondary'} size="xs">
                            {upcoming.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activated">
                    <FeatureGateTable<ActivatedFeature>
                        features={activated}
                        cluster={cluster}
                        secondColumn={{
                            header: 'Activation',
                            render: feature => (
                                <ActivationCell
                                    cluster={cluster}
                                    epoch={feature.clusterActivationEpoch}
                                    epochScheduleInfo={epochScheduleInfo}
                                />
                            ),
                        }}
                        emptyState={<EmptyStateCard>No activated features on {clusterName(cluster)}.</EmptyStateCard>}
                    />
                </TabsContent>
                <TabsContent value="upcoming">
                    <FeatureGateTable<UpcomingFeature>
                        features={upcoming}
                        cluster={cluster}
                        secondColumn={{
                            header: 'Activated elsewhere',
                            render: feature => <OtherActivationsCell activations={feature.otherActivations} />,
                        }}
                        emptyState={
                            <EmptyStateCard>
                                {cluster === Cluster.Testnet
                                    ? 'No upcoming features on testnet. New features activate on testnet first, so this list is usually empty here.'
                                    : `No upcoming features on ${clusterName(cluster)}.`}
                            </EmptyStateCard>
                        }
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ActivationCell({
    cluster,
    epoch,
    epochScheduleInfo,
}: {
    cluster: Cluster;
    epoch: number;
    epochScheduleInfo: EpochScheduleInfo | undefined;
}) {
    const countdown = epochScheduleInfo
        ? estimateTimeUntilEpoch({ ...epochScheduleInfo, targetEpoch: epoch })
        : undefined;
    return (
        <>
            <Link
                href={`/epoch/${epoch}?cluster=${clusterSlug(cluster)}`}
                className="e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
            >
                {epoch}
            </Link>
            {countdown && <div className="e-mt-0.5 e-text-dk-xs e-text-dk-gray-700">in ~{countdown}</div>}
        </>
    );
}

function OtherActivationsCell({ activations }: { activations: ClusterActivation[] }) {
    return (
        <div className="e-flex e-flex-col e-gap-0.5 e-whitespace-nowrap e-text-dk-sm">
            {activations.map(({ cluster, epoch }) => (
                <Link
                    key={cluster}
                    href={`/epoch/${epoch}?cluster=${clusterSlug(cluster)}`}
                    className="e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
                >
                    {clusterName(cluster)}: {epoch}
                </Link>
            ))}
        </div>
    );
}
