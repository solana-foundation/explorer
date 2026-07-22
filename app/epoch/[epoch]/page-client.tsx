'use client';

import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { FetchStatus } from '@providers/cache';
import { useCluster, useClusterInfo } from '@providers/cluster';
import { useEpoch, useFetchEpoch } from '@providers/epoch';
import { ClusterStatus } from '@utils/cluster';
import { displayTimestampUtc } from '@utils/date';
import React from 'react';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';
import { getFirstSlotInEpoch, getLastSlotInEpoch } from '@/app/utils/epoch-schedule';

type Props = {
    params: {
        epoch: string;
    };
};

export default function EpochDetailsPageClient({ params: { epoch } }: Props) {
    let output;
    if (isNaN(Number(epoch))) {
        output = <ErrorCard text={`Epoch ${epoch} is not valid`} />;
    } else {
        output = <EpochOverviewCard epoch={Number(epoch)} />;
    }

    return (
        <PageContainer variant="pulled-up">
            <div className="mb-8">
                <div className="border-0 border-b border-solid border-dk-gray-700-dark py-6">
                    <h6 className="uppercase tracking-[0.08em] text-dk-gray-700">Details</h6>
                    <h2 className="mb-0">Epoch</h2>
                </div>
            </div>
            {output}
        </PageContainer>
    );
}

type OverviewProps = { epoch: number };

function EpochOverviewCard({ epoch }: OverviewProps) {
    const { status } = useCluster();
    const clusterInfo = useClusterInfo();

    const epochState = useEpoch(epoch);
    const fetchEpoch = useFetchEpoch();

    // Fetch extra epoch info on load
    React.useEffect(() => {
        if (!clusterInfo) return;
        const { epochInfo, epochSchedule } = clusterInfo;
        const currentEpoch = epochInfo.epoch;
        if (epoch <= currentEpoch && !epochState && status === ClusterStatus.Connected)
            fetchEpoch(epoch, currentEpoch, epochSchedule);
    }, [epoch, epochState, clusterInfo, status, fetchEpoch]);

    if (!clusterInfo) {
        return <LoadingCard message="Connecting to cluster" />;
    }

    const { epochInfo, epochSchedule } = clusterInfo;
    const currentEpoch = epochInfo.epoch;
    if (epoch > currentEpoch) {
        return <ErrorCard text={`Epoch ${epoch} hasn't started yet`} />;
    } else if (!epochState?.data) {
        if (epochState?.status === FetchStatus.FetchFailed) {
            return <ErrorCard text={`Failed to fetch details for epoch ${epoch}`} />;
        }
        return <LoadingCard message="Loading epoch" />;
    }

    const firstSlot = getFirstSlotInEpoch(epochSchedule, BigInt(epoch));
    const lastSlot = getLastSlotInEpoch(epochSchedule, BigInt(epoch));

    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit" className="flex items-center">
                        Overview
                    </CardTitle>
                </CardHeader>
                <TableCardBody>
                    <tr>
                        <td className="w-full">Epoch</td>
                        <td className="text-right font-mono">
                            <Epoch epoch={epoch} />
                        </td>
                    </tr>
                    {epoch > 0 && (
                        <tr>
                            <td className="w-full">Previous Epoch</td>
                            <td className="text-right font-mono">
                                <Epoch epoch={epoch - 1} link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td className="w-full">Next Epoch</td>
                        <td className="text-right font-mono">
                            {currentEpoch > epoch ? (
                                <Epoch epoch={epoch + 1} link />
                            ) : (
                                <span className="text-dk-gray-700">Epoch in progress</span>
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td className="w-full">First Slot</td>
                        <td className="text-right font-mono">
                            <Slot slot={firstSlot} />
                        </td>
                    </tr>
                    <tr>
                        <td className="w-full">Last Slot</td>
                        <td className="text-right font-mono">
                            <Slot slot={lastSlot} />
                        </td>
                    </tr>
                    {epochState.data.firstTimestamp && (
                        <tr>
                            <td className="w-full">First Block Timestamp</td>
                            <td className="text-right">
                                <span className="font-mono">
                                    {displayTimestampUtc(epochState.data.firstTimestamp * 1000, true)}
                                </span>
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td className="w-full">First Block</td>
                        <td className="text-right font-mono">
                            <Slot slot={epochState.data.firstBlock} link />
                        </td>
                    </tr>
                    <tr>
                        <td className="w-full">Last Block</td>
                        <td className="text-right font-mono">
                            {epochState.data.lastBlock !== undefined ? (
                                <Slot slot={epochState.data.lastBlock} link />
                            ) : (
                                <span className="text-dk-gray-700">Epoch in progress</span>
                            )}
                        </td>
                    </tr>
                    {epochState.data.lastTimestamp && (
                        <tr>
                            <td className="w-full">Last Block Timestamp</td>
                            <td className="text-right">
                                <span className="font-mono">
                                    {displayTimestampUtc(epochState.data.lastTimestamp * 1000, true)}
                                </span>
                            </td>
                        </tr>
                    )}
                </TableCardBody>
            </Card>
        </>
    );
}
