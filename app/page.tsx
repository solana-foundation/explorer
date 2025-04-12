'use client';

import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { LiveTransactionStatsCard } from '@components/LiveTransactionStatsCard';
import { StatsNotReady } from '@components/StatsNotReady';
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

import { UpcomingFeatures } from './utils/feature-gate/UpcomingFeatures';

export default function Page() {
    return (
        <StatsProvider>
            <SupplyProvider>
                <div className="container mt-4">
                    <StakingComponent />

                    <div className="row d-flex">
                        <div className="col-md-6 d-flex">
                            <StatsCardBody />
                        </div>
                        <div className="col-md-6 d-flex">
                            <LiveTransactionStatsCard />
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <div className="card-title d-flex justify-content-between border-bottom border-gray-300 pb-2">
                                <div className="me-4">Kickstart your development journey on Solana</div>
                                <div>
                                    Find more on{' '}
                                    <a href="https://solana.com/developers" target="_blank" rel="noreferrer">
                                        solana.com/developers
                                    </a>
                                </div>
                            </div>
                            <div className="d-flex gap-4 pb-3 overflow-auto">
                                <EcosystemCard
                                    title="Setup Your Solana Environment"
                                    description="Set up your local environment for Solana development"
                                    image="https://solana.com/opengraph/developers/docs/intro/installation"
                                    link="https://solana.com/docs/intro/installation"
                                />
                                <EcosystemCard
                                    title="Quick Start Guide"
                                    description="A guide to help you get started with Solana development"
                                    image="https://solana.com/_next/image?url=%2Fassets%2Fdocs%2Fintro%2Fquickstart%2Fpg-not-connected.png&w=1920&q=75"
                                    link="https://solana.com/docs/intro/quick-start"
                                />
                                <EcosystemCard
                                    title="Solana Developer Bootcamp"
                                    description="A comprehensive guide to Solana development"
                                    image="https://i.ytimg.com/vi/amAq-WHAFs8/maxresdefault.jpg"
                                    link="https://www.youtube.com/watch?v=amAq-WHAFs8&list=PLilwLeBwGuK7HN8ZnXpGAD9q6i4syhnVc&ab_channel=Solana"
                                />
                                <EcosystemCard
                                    title="Solana Tutorial"
                                    description="A comprehensive guide to Solana development"
                                    image="https://www.rareskills.io/wp-content/uploads/2024/08/og-image-rareskills.png"
                                    imageBackground="white"
                                    link="https://www.rareskills.io/solana-tutorial"
                                />
                            </div>
                        </div>
                    </div>

                    <UpcomingFeatures />
                </div>
            </SupplyProvider>
        </StatsProvider>
    );
}

function EcosystemCard({
    title,
    description,
    image,
    link,
    imageBackground,
}: {
    title: string;
    description: string;
    image: string;
    imageBackground?: string;
    link: string;
}) {
    return (
        <div className="flex flex-col" style={{ width: '250px', height: '200px' }}>
            <div className="w-full mb-3">
                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:cursor-pointer">
                    <img
                        src={image}
                        alt={`${title} preview`}
                        style={{
                            width: '250px',
                            height: '120px',
                            objectFit: 'cover',
                            backgroundColor: imageBackground,
                        }}
                    />
                </a>
            </div>
            <div className="flex flex-col">
                <p className="mb-1">{title}</p>
                <p className="text-muted mb-2 text-wrap line-clamp-3">{description}</p>
            </div>
        </div>
    );
}

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
        return <LoadingCard message="Loading supply data" />;
    } else if (typeof supply === 'string') {
        return <ErrorCard text={supply} retry={fetchData} />;
    }

    // Calculate to 2dp for accuracy, then display as 1
    const circulatingPercentage = percentage(supply.circulating, supply.total, 2).toFixed(1);

    let delinquentStakePercentage;
    if (delinquentStake && activeStake) {
        delinquentStakePercentage = percentage(delinquentStake, activeStake, 2).toFixed(1);
    }

    return (
        <div className="row staking-card">
            <div className="col-6 col-xl">
                <div className="card">
                    <div className="card-body">
                        <h4>Circulating Supply</h4>
                        <h1>
                            <em>{displayLamports(supply.circulating)}</em> /{' '}
                            <small>{displayLamports(supply.total)}</small>
                        </h1>
                        <h5>
                            <em>{circulatingPercentage}%</em> is circulating
                        </h5>
                    </div>
                </div>
            </div>
            <div className="col-6 col-xl">
                <div className="card">
                    <div className="card-body">
                        <h4>Active Stake</h4>
                        {activeStake ? (
                            <h1>
                                <em>{displayLamports(activeStake)}</em> / <small>{displayLamports(supply.total)}</small>
                            </h1>
                        ) : null}
                        {delinquentStakePercentage && (
                            <h5>
                                Delinquent stake: <em>{delinquentStakePercentage}%</em>
                            </h5>
                        )}
                    </div>
                </div>
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
    const epochProgress = percentage(slotIndex, slotsInEpoch, 2).toFixed(1) + '%';
    const epochTimeRemaining = slotsToHumanString(Number(slotsInEpoch - slotIndex), hourlySlotTime);
    const { blockHeight, absoluteSlot } = epochInfo;

    return (
        <div className="card flex-grow-1">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <h4 className="card-header-title">Live Cluster Stats</h4>
                    </div>
                </div>
            </div>
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
                            <TimestampToggle unixTimestamp={blockTime} shorter></TimestampToggle>
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
        </div>
    );
}
