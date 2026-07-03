'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/shared/ui/tabs';
import { useCluster, useClusterInfo } from '@/app/providers/cluster';
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
    const { cluster } = useCluster();
    const clusterInfo = useClusterInfo();
    const { activated, upcoming } = useMemo(() => partitionFeatures(cluster), [cluster]);
    const [tab, setTab] = useState<TabValue>('activated');

    if (cluster === Cluster.Custom) {
        return (
            <div className="mx-auto max-w-screen-xl px-4 py-4">
                <h1 className="mb-4 text-2xl font-semibold text-dk-white">Feature Gates</h1>
                <Card variant="tight">
                    <CardHeader>
                        <CardTitle>Custom cluster</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-dark-foreground">
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
        <div className="mx-auto max-w-screen-xl px-4 py-4">
            <div className="mb-4 flex items-baseline gap-3">
                <h1 className="text-2xl font-semibold text-dk-white">Feature Gates</h1>
                <span className="text-sm text-dark-foreground">{clusterName(cluster)}</span>
            </div>

            <Tabs value={tab} onValueChange={value => setTab(value as TabValue)}>
                <TabsList className="mb-4 gap-6 border-b border-heavy-metal-950">
                    <TabsTrigger value="activated" className="flex items-center gap-2">
                        Activated
                        <Badge variant="secondary" size="xs">
                            {activated.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="flex items-center gap-2">
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
                className="text-dk-primary-dark hover:text-dark-accent"
            >
                {epoch}
            </Link>
            {countdown && <div className="mt-0.5 text-dk-xs text-dark-muted-foreground">in ~{countdown}</div>}
        </>
    );
}

function OtherActivationsCell({ activations }: { activations: ClusterActivation[] }) {
    return (
        <div className="flex flex-col gap-0.5 whitespace-nowrap text-dk-sm">
            {activations.map(({ cluster, epoch }) => (
                <Link
                    key={cluster}
                    href={`/epoch/${epoch}?cluster=${clusterSlug(cluster)}`}
                    className="text-dk-primary-dark hover:text-dark-accent"
                >
                    {clusterName(cluster)}: {epoch}
                </Link>
            ))}
        </div>
    );
}
