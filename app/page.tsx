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
                                    title="Solana Developer MCP"
                                    description="AI powered Solana developer tools for Cursor, Windsurf, Cline and more"
                                    image="https://mcp.solana.com/meta.png"
                                    link="https://mcp.solana.com"
                                />
                                <EcosystemCard
                                    title="brine-ed25519"
                                    description="A pure-Rust implementation of Ed25519 digital signatures"
                                    image="https://private-user-images.githubusercontent.com/623790/432522277-cc354cf3-b82d-40c6-8c9a-9902fae146f0.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ0MDc5ODksIm5iZiI6MTc0NDQwNzY4OSwicGF0aCI6Ii82MjM3OTAvNDMyNTIyMjc3LWNjMzU0Y2YzLWI4MmQtNDBjNi04YzlhLTk5MDJmYWUxNDZmMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNDExJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDQxMVQyMTQxMjlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0xN2YwMDA0NjI0MTM2YWJhNGIzZGZhNjZhODY4ZmNkOThlM2MzZjEyZDk0NWMyODNhNGJjN2Y4ZGMyMmYzYjQxJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.k1TiwzVzO-cEeZl99Re-izipt_P2GXWJ0U6zF2_bb3s"
                                    link="https://github.com/zfedoran/brine-ed25519"
                                />
                                <EcosystemCard
                                    title="Gill"
                                    description="A Simplified Javascript Client for Solana"
                                    image="https://raw.githubusercontent.com/solana-foundation/gill/refs/heads/master/media/cover.png"
                                    link="https://github.com/solana-foundation/gill"
                                />
                                <EcosystemCard
                                    title="Pinocchio"
                                    description="A Solana CLI tool for creating and managing Solana programs"
                                    image="https://private-user-images.githubusercontent.com/729235/355061608-3a1894b4-403f-4c35-90aa-548e7672fe90.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ0MDc5NDMsIm5iZiI6MTc0NDQwNzY0MywicGF0aCI6Ii83MjkyMzUvMzU1MDYxNjA4LTNhMTg5NGI0LTQwM2YtNGMzNS05MGFhLTU0OGU3NjcyZmU5MC5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNDExJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDQxMVQyMTQwNDNaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1iOGVlMzcxYWZkMTVmZDM3ZmQwOTIyOTA0ZDc5YTliYmIwMTg3Y2MxZWM5ZTA4YTIzMTYxOTZlODY3M2E3YjI0JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.A-knzozh3jI3qe17grkmg6scHrTJAAk4ellDlMAMAU0"
                                    link="https://github.com/anza-xyz/pinocchio"
                                />
                                <EcosystemCard
                                    title="Codama"
                                    description="A Solana CLI tool for creating and managing Solana programs"
                                    image="https://private-user-images.githubusercontent.com/3642397/374996178-029af336-ea71-4e7f-9612-ef5bb187e3a0.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ0MDgwNDMsIm5iZiI6MTc0NDQwNzc0MywicGF0aCI6Ii8zNjQyMzk3LzM3NDk5NjE3OC0wMjlhZjMzNi1lYTcxLTRlN2YtOTYxMi1lZjViYjE4N2UzYTAucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxMSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTFUMjE0MjIzWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9ZjJkN2IzMDA0NzVhNTk1MjU4NDY0MjcwM2U0Mzg4MTQ4ZDVmOWU2ZGFkNTc3MzBjZjJiOWIxZjQ1MGY2ZTFjYSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.5lEayJzf-0ZIxiMz8RbhMaUaluZPym5dFGy7blhlnMw"
                                    link="https://github.com/codama-idl/codama"
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
}: {
    title: string;
    description: string;
    image: string;
    link: string;
}) {
    return (
        <div className="flex flex-col" style={{ width: '250px', height: '200px' }}>
            <div className="w-full mb-3">
                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:cursor-pointer">
                    <img
                        src={image}
                        alt={`${title} preview`}
                        style={{ width: '250px', height: '120px', objectFit: 'cover' }}
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
