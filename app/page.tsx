'use client';

import { Epoch } from '@components/common/Epoch';
import { Slot } from '@components/common/Slot';
import { LiveTransactionStatsCard, STATS_LABEL_WIDTH } from '@components/LiveTransactionStatsCard';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { StatsNotReady } from '@components/StatsNotReady';
import { AlpenglowCard } from '@features/alpenglow';
import { UpcomingFeatures } from '@features/feature-gate';
import { useCluster } from '@providers/cluster';
import { StatsProvider } from '@providers/stats';
import {
    ClusterStatsStatus,
    useDashboardInfo,
    usePerformanceInfo,
    useStatsProvider,
} from '@providers/stats/solanaClusterStats';
import { slotsToHumanString } from '@utils/index';
import { percentage } from '@utils/math';
import React from 'react';

import { Timestamp } from '@/app/components/shared/ui/timestamp';
import { KeyValue, TextValue } from '@/app/shared/ui/key-value';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

import { DeveloperResources } from './components/DeveloperResources';
import { StakingSection } from './components/StakingSection';

export default function Page() {
    return (
        <StatsProvider>
            {/* The top padding doubles the transaction page's; the bottom one adds to the root layout's 24px so the last
                section ends 80px above the footer, as on the other pages. */}
            <PageContainer className="flex flex-col gap-9 pb-14 pt-6 lg:pt-10">
                <StakingSection />

                <div className="grid gap-x-6 gap-y-9 md:grid-cols-2">
                    <StatsCardBody />
                    <LiveTransactionStatsCard />
                </div>

                <AlpenglowCard />

                <DeveloperResources />

                <UpcomingFeatures />
            </PageContainer>
        </StatsProvider>
    );
}

function StatsCardBody() {
    const { setActive } = useStatsProvider();
    const { cluster } = useCluster();

    React.useEffect(() => {
        setActive(true);
        return () => setActive(false);
    }, [setActive, cluster]);

    return (
        <CollapsibleSection title="Live Cluster Stats" collapsible={false} fill>
            <ClusterStatsRows />
        </CollapsibleSection>
    );
}

function ClusterStatsRows() {
    const dashboardInfo = useDashboardInfo();
    const performanceInfo = usePerformanceInfo();

    if (performanceInfo.status !== ClusterStatsStatus.Ready || dashboardInfo.status !== ClusterStatsStatus.Ready) {
        const error =
            performanceInfo.status === ClusterStatsStatus.Error || dashboardInfo.status === ClusterStatsStatus.Error;
        return <StatsNotReady error={error} />;
    }

    const { msPerSlot_1h, msPerSlot_1min, epochInfo, blockTime } = dashboardInfo;
    const { slotIndex, slotsInEpoch } = epochInfo;
    const epochProgress = `${percentage(slotIndex, slotsInEpoch, 2).toFixed(1)}%`;
    const epochTimeRemaining = slotsToHumanString(Number(slotsInEpoch - slotIndex), msPerSlot_1h);
    const { blockHeight, absoluteSlot } = epochInfo;

    return (
        <>
            <KeyValue label="Slot" labelWidth={STATS_LABEL_WIDTH}>
                <Slot slot={absoluteSlot} link />
            </KeyValue>
            {blockHeight !== undefined && (
                <KeyValue label="Block height" labelWidth={STATS_LABEL_WIDTH}>
                    <Slot slot={blockHeight} />
                </KeyValue>
            )}
            {blockTime && (
                <KeyValue label="Cluster time" labelWidth={STATS_LABEL_WIDTH}>
                    {/* The stats provider keeps block time in milliseconds; Timestamp takes seconds. */}
                    <Timestamp unixTimestamp={Math.floor(blockTime / 1000)} />
                </KeyValue>
            )}
            {msPerSlot_1min !== undefined && (
                <KeyValue label="Slot time (1min average)" labelWidth={STATS_LABEL_WIDTH}>
                    <TextValue mono={false}>{msPerSlot_1min}ms</TextValue>
                </KeyValue>
            )}
            <KeyValue label="Slot time (1hr average)" labelWidth={STATS_LABEL_WIDTH}>
                <TextValue mono={false}>{msPerSlot_1h}ms</TextValue>
            </KeyValue>
            <KeyValue label="Epoch" labelWidth={STATS_LABEL_WIDTH}>
                <Epoch epoch={epochInfo.epoch} link />
            </KeyValue>
            <KeyValue label="Epoch progress" labelWidth={STATS_LABEL_WIDTH}>
                <TextValue mono={false}>{epochProgress}</TextValue>
            </KeyValue>
            <KeyValue label="Epoch time remaining (approx.)" labelWidth={STATS_LABEL_WIDTH}>
                <TextValue mono={false}>~{epochTimeRemaining}</TextValue>
            </KeyValue>
        </>
    );
}
