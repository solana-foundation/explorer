'use client';

import { Epoch } from '@components/common/Epoch';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { LiveTransactionStatsCard } from '@components/LiveTransactionStatsCard';
import { StatsNotReady } from '@components/StatsNotReady';
import { useCluster } from '@providers/cluster';
import { StatsProvider } from '@providers/stats';
import {
    ClusterStatsStatus,
    useDashboardInfo,
    usePerformanceInfo,
    useStatsProvider,
} from '@providers/stats/solanaClusterStats';
import { SupplyProvider } from '@providers/supply';
import { slotsToHumanString } from '@utils/index';
import { percentage } from '@utils/math';
import React from 'react';

export default function Page() {
    return (
        <StatsProvider>
            <SupplyProvider>
                <div className="container mt-4">
                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col">
                                    <h4 className="card-header-title">Live Cluster Stats</h4>
                                </div>
                            </div>
                        </div>
                        <StatsCardBody />
                    </div>
                    <LiveTransactionStatsCard />
                </div>
            </SupplyProvider>
        </StatsProvider>
    );
}

function StatsCardBody() {
    const dashboardInfo = useDashboardInfo();
    const performanceInfo = usePerformanceInfo();
    const { setActive } = useStatsProvider();
    const { cluster } = useCluster();

    React.useEffect(() => {
        setActive(true);
        return () => setActive(false);
    }, [setActive, cluster]);

    if (performanceInfo.status !== ClusterStatsStatus.Ready || dashboardInfo.status !== ClusterStatsStatus.Ready) {
        const error =
            performanceInfo.status === ClusterStatsStatus.Error || dashboardInfo.status === ClusterStatsStatus.Error;
        return <StatsNotReady error={error} />;
    }

    const { avgSlotTime_1h, avgSlotTime_1min, epochInfo, blockTime } = dashboardInfo;
    const hourlySlotTime = Math.round(1000 * avgSlotTime_1h);
    const averageSlotTime = Math.round(1000 * avgSlotTime_1min);
    const { slotIndex, slotsInEpoch } = epochInfo;
    const epochProgress = percentage(slotIndex, slotsInEpoch, 2).toFixed(1) + '%';
    const epochTimeRemaining = slotsToHumanString(Number(slotsInEpoch - slotIndex), hourlySlotTime);
    const { blockHeight, absoluteSlot } = epochInfo;

    return (
        <TableCardBody>
            <tr>
                <td className="w-100">Slot</td>
                <td className="text-lg-end font-monospace">
                    <Slot slot={absoluteSlot} link />
                </td>
            </tr>
            {blockHeight !== undefined && (
                <tr>
                    <td className="w-100">Block height</td>
                    <td className="text-lg-end font-monospace">
                        <Slot slot={blockHeight} />
                    </td>
                </tr>
            )}
            {blockTime && (
                <tr>
                    <td className="w-100">Cluster time</td>
                    <td className="text-lg-end font-monospace">
                        <TimestampToggle unixTimestamp={blockTime}></TimestampToggle>
                    </td>
                </tr>
            )}
            <tr>
                <td className="w-100">Slot time (1min average)</td>
                <td className="text-lg-end font-monospace">{averageSlotTime}ms</td>
            </tr>
            <tr>
                <td className="w-100">Slot time (1hr average)</td>
                <td className="text-lg-end font-monospace">{hourlySlotTime}ms</td>
            </tr>
            <tr>
                <td className="w-100">Epoch</td>
                <td className="text-lg-end font-monospace">
                    <Epoch epoch={epochInfo.epoch} link />
                </td>
            </tr>
            <tr>
                <td className="w-100">Epoch progress</td>
                <td className="text-lg-end font-monospace">{epochProgress}</td>
            </tr>
            <tr>
                <td className="w-100">Epoch time remaining (approx.)</td>
                <td className="text-lg-end font-monospace">~{epochTimeRemaining}</td>
            </tr>
        </TableCardBody>
    );
}
