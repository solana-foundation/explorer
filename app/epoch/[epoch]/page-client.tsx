'use client';

import { Copyable } from '@components/common/Copyable';
import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { FetchStatus } from '@providers/cache';
import { useCluster, useClusterInfo } from '@providers/cluster';
import { useEpoch, useFetchEpoch } from '@providers/epoch';
import { ClusterStatus } from '@utils/cluster';
import React from 'react';

import { Timestamp } from '@/app/components/shared/ui/timestamp';
import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';
import { PageHeader, PageLayout, PageSections } from '@/app/shared/ui/page-layout';
import { getFirstSlotInEpoch, getLastSlotInEpoch } from '@/app/utils/epoch-schedule';

type Props = {
    params: {
        epoch: string;
    };
};

export default function EpochDetailsPageClient({ params: { epoch } }: Props) {
    const content = isNaN(Number(epoch)) ? (
        <ErrorCard text={`Epoch ${epoch} is not valid`} />
    ) : (
        <EpochOverviewCard epoch={Number(epoch)} />
    );

    return (
        <PageLayout>
            <PageHeader eyebrow="Details" title="Epoch" />
            <PageSections>{content}</PageSections>
        </PageLayout>
    );
}

type OverviewProps = { epoch: number };

function EpochOverviewCard({ epoch }: OverviewProps) {
    const { status } = useCluster();
    const clusterInfo = useClusterInfo();

    const epochState = useEpoch(epoch);
    const fetchEpoch = useFetchEpoch();

    React.useEffect(() => {
        if (!clusterInfo) return;
        const { epochInfo, epochSchedule } = clusterInfo;
        const currentEpoch = epochInfo.epoch;
        if (epoch <= currentEpoch && !epochState && status === ClusterStatus.Connected)
            fetchEpoch(epoch, currentEpoch, epochSchedule);
    }, [epoch, epochState, clusterInfo, status, fetchEpoch]);

    // Ahead of the `clusterInfo` check, which is also unresolved on a failed connection: the epoch entry
    // only reports a failure once something has actually failed, so it is the more specific answer.
    if (epochState?.status === FetchStatus.FetchFailed) {
        return <ErrorCard text={`Failed to fetch details for epoch ${epoch}`} />;
    }

    if (!clusterInfo) {
        return <LoadingCard message="Connecting to cluster" />;
    }

    const { epochInfo, epochSchedule } = clusterInfo;
    const currentEpoch = epochInfo.epoch;
    if (epoch > currentEpoch) {
        return <ErrorCard text={`Epoch ${epoch} hasn't started yet`} />;
    } else if (!epochState?.data) {
        return <LoadingCard message="Loading epoch" />;
    }

    const { data } = epochState;
    const firstSlot = getFirstSlotInEpoch(epochSchedule, BigInt(epoch));
    const lastSlot = getLastSlotInEpoch(epochSchedule, BigInt(epoch));
    const inProgress = <span className="text-outer-space-300">Epoch in progress</span>;

    const rows: KeyValueRow[] = [
        {
            label: 'Epoch',
            value: (
                <Copyable text={String(epoch)}>
                    <Epoch epoch={epoch} />
                </Copyable>
            ),
        },
        { label: 'Previous Epoch', show: epoch > 0, value: <Epoch epoch={epoch - 1} link /> },
        { label: 'Next Epoch', value: currentEpoch > epoch ? <Epoch epoch={epoch + 1} link /> : inProgress },
        { label: 'First Slot', value: <Slot slot={firstSlot} /> },
        { label: 'Last Slot', value: <Slot slot={lastSlot} /> },
        {
            label: 'First Block Timestamp',
            show: Boolean(data.firstTimestamp),
            value: data.firstTimestamp && <Timestamp unixTimestamp={data.firstTimestamp} />,
        },
        { label: 'First Block', value: <Slot slot={data.firstBlock} link /> },
        { label: 'Last Block', value: data.lastBlock !== undefined ? <Slot slot={data.lastBlock} link /> : inProgress },
        {
            label: 'Last Block Timestamp',
            show: Boolean(data.lastTimestamp),
            value: data.lastTimestamp && <Timestamp unixTimestamp={data.lastTimestamp} />,
        },
    ];

    return (
        <OverviewCard title="Overview">
            <KeyValueRows rows={rows} />
        </OverviewCard>
    );
}
