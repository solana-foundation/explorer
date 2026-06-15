'use client';

import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { LiveTransactionStatsCard } from '@components/LiveTransactionStatsCard';
import { StatsNotReady } from '@components/StatsNotReady';
import { UpcomingFeatures } from '@features/feature-gate';
import { useVoteAccounts } from '@providers/accounts/vote-accounts';
import { useCluster } from '@providers/cluster';
import { StatsProvider } from '@providers/stats';
import {
    ClusterStatsStatus,
    useDashboardInfo,
    usePerformanceInfo,
    useStatsProvider,
} from '@providers/stats/solanaClusterStats';
import { Status, SupplyProvider, useFetchSupply, useSupply } from '@providers/supply';
import { ClusterStatus } from '@utils/cluster';
import { abbreviatedNumber, lamportsToSol, slotsToHumanString } from '@utils/index';
import { percentage } from '@utils/math';
import React from 'react';

import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

import { DeveloperResources } from './components/DeveloperResources';
import { SimpleCardSkeleton } from './components/shared/Skeletons';

export default function Page() {
    return (
        <StatsProvider>
            <SupplyProvider>
                <PageContainer className="e-mt-4">
                    <StakingComponent />

                    <div className="e-flex e-flex-col lg:e-flex-row lg:e-gap-6">
                        <div className="e-w-full lg:e-w-1/2">
                            <StatsCardBody />
                        </div>
                        <div className="e-w-full lg:e-w-1/2">
                            <LiveTransactionStatsCard />
                        </div>
                    </div>

                    <DeveloperResources />

                    <UpcomingFeatures />
                </PageContainer>
            </SupplyProvider>
        </StatsProvider>
    );
}

const LoadingStatsCard = ({ title }: { title: string }) => {
    return (
        <div className="e-flex e-items-center e-gap-2">
            <span className="e-spinner-grow e-spinner-grow-sm e-shrink-0" />
            {title}
        </div>
    );
};

function StakingComponent() {
    const { status } = useCluster();
    const supply = useSupply();
    const fetchSupply = useFetchSupply();
    const { fetchVoteAccounts, voteAccounts } = useVoteAccounts();

    function fetchData() {
        fetchSupply();
        fetchVoteAccounts();
    }

    React.useEffect(() => {
        if (status === ClusterStatus.Connected) {
            fetchData();
        }
    }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    const delinquentStake = React.useMemo(() => {
        if (voteAccounts) {
            return voteAccounts.delinquent.reduce((prev, current) => prev + current.activatedStake, BigInt(0));
        }
    }, [voteAccounts]);

    const activeStake = React.useMemo(() => {
        if (voteAccounts && delinquentStake) {
            return (
                voteAccounts.current.reduce((prev, current) => prev + current.activatedStake, BigInt(0)) +
                delinquentStake
            );
        }
    }, [voteAccounts, delinquentStake]);

    if (supply === Status.Disconnected) {
        // we'll return here to prevent flicker
        return null;
    }

    if (supply === Status.Idle || supply === Status.Connecting) {
        return (
            <div className="e-flex e-flex-col md:e-flex-row md:e-gap-6">
                <SimpleCardSkeleton title={<LoadingStatsCard title="Loading supply data" />} />
                <SimpleCardSkeleton title={<LoadingStatsCard title="Loading staking data" />} />
            </div>
        );
    } else if (typeof supply === 'string') {
        return <ErrorCard text={supply} retry={fetchData} />;
    }

    // Don't display the staking card if the supply is 0
    if (supply.circulating === BigInt(0) && supply.total === BigInt(0)) {
        return null;
    }

    // Calculate to 2dp for accuracy, then display as 1
    const circulatingPercentage = percentage(supply.circulating, supply.total, 2).toFixed(1);

    let delinquentStakePercentage;
    if (delinquentStake && activeStake) {
        delinquentStakePercentage = percentage(delinquentStake, activeStake, 2).toFixed(1);
    }

    return (
        <div className="e-flex e-flex-col md:e-flex-row md:e-gap-6">
            <div className="e-w-full md:e-w-1/2">
                <Card ui="dashkit" className="e-mb-3 md:e-mb-6">
                    <CardBody ui="dashkit">
                        <h4>Circulating Supply</h4>
                        <h1 className="e-mb-3">
                            <em className="e-not-italic e-text-dark-accent">{displayLamports(supply.circulating)}</em>{' '}
                            / <small className="e-text-base">{displayLamports(supply.total)}</small>
                        </h1>
                        <h5 className="e-mb-0">
                            <em className="e-not-italic e-text-dark-accent">{circulatingPercentage}%</em> is circulating
                        </h5>
                    </CardBody>
                </Card>
            </div>
            <div className="e-w-full md:e-w-1/2">
                <Card ui="dashkit" className="e-mb-3 md:e-mb-6">
                    <CardBody ui="dashkit">
                        <h4>Active Stake</h4>
                        {activeStake ? (
                            <h1 className="e-mb-3">
                                <em className="e-not-italic e-text-dark-accent">{displayLamports(activeStake)}</em> /{' '}
                                <small className="e-text-base">{displayLamports(supply.total)}</small>
                            </h1>
                        ) : null}
                        {delinquentStakePercentage && (
                            <h5 className="e-mb-0">
                                Delinquent stake:{' '}
                                <em className="e-not-italic e-text-dark-accent">{delinquentStakePercentage}%</em>
                            </h5>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

function displayLamports(value: number | bigint) {
    return abbreviatedNumber(lamportsToSol(value));
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
    const epochProgress = `${percentage(slotIndex, slotsInEpoch, 2).toFixed(1)}%`;
    const epochTimeRemaining = slotsToHumanString(Number(slotsInEpoch - slotIndex), hourlySlotTime);
    const { blockHeight, absoluteSlot } = epochInfo;

    return (
        <Card ui="dashkit" flex="grow" className="e-mb-3 md:e-mb-6">
            <CardHeader ui="dashkit">
                <CardTitle as="h4" ui="dashkit">
                    Live Cluster Stats
                </CardTitle>
            </CardHeader>
            <TableCardBody layout="expanded" className="[&_td:first-child]:!e-w-2/5 md:[&_td:first-child]:!e-w-auto">
                <tr>
                    <td className="e-w-full">Slot</td>
                    <td className="e-text-right e-font-mono">
                        <Slot slot={absoluteSlot} link />
                    </td>
                </tr>
                {blockHeight !== undefined && (
                    <tr>
                        <td className="e-w-full">Block height</td>
                        <td className="e-text-right e-font-mono">
                            <Slot slot={blockHeight} />
                        </td>
                    </tr>
                )}
                {blockTime && (
                    <tr>
                        <td className="e-w-full">Cluster time</td>
                        <td className="e-text-right e-font-mono">
                            <TimestampToggle unixTimestamp={blockTime} shorter></TimestampToggle>
                        </td>
                    </tr>
                )}
                <tr>
                    <td className="e-w-full">Slot time (1min average)</td>
                    <td className="e-text-right e-font-mono">{averageSlotTime}ms</td>
                </tr>
                <tr>
                    <td className="e-w-full">Slot time (1hr average)</td>
                    <td className="e-text-right e-font-mono">{hourlySlotTime}ms</td>
                </tr>
                <tr>
                    <td className="e-w-full">Epoch</td>
                    <td className="e-text-right e-font-mono">
                        <Epoch epoch={epochInfo.epoch} link />
                    </td>
                </tr>
                <tr>
                    <td className="e-w-full">Epoch progress</td>
                    <td className="e-text-right e-font-mono">{epochProgress}</td>
                </tr>
                <tr>
                    <td className="e-w-full">Epoch time remaining (approx.)</td>
                    <td className="e-text-right e-font-mono">~{epochTimeRemaining}</td>
                </tr>
            </TableCardBody>
        </Card>
    );
}
