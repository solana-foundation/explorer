'use client';

import { Button } from '@components/shared/ui/button';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { useSupply } from '@features/supply';
import { useVoteAccounts, type VoteAccountsState } from '@features/vote/model/vote-accounts'; // deep import on purpose: the barrel pulls the vote instruction cards into the home bundle for one hook
import { abbreviatedNumber, lamportsToSol } from '@utils/index';
import { percentage } from '@utils/math';
import React from 'react';

// Stake is drawn against total supply, so it cannot render before supply does. The wait is one-way: once
// supply is in hand its card stays up while stake is still coming.
export function StakingSection() {
    const supplyState = useSupply();
    const voteAccounts = useVoteAccounts();

    if (supplyState.kind === 'loading') {
        return (
            <div className={GRID_CLASS}>
                <StatsSection title="Circulating Supply">
                    <LoadingStatsCard title="Loading supply data" />
                </StatsSection>
                <StatsSection title="Active Stake">
                    <LoadingStatsCard title="Loading staking data" />
                </StatsSection>
            </div>
        );
    }

    // Supply alone: the staking card owns its own retry, and it is not on screen in either branch.
    if (supplyState.kind === 'failed') {
        return (
            <StatsSection title="Circulating Supply">
                <StatsMessage retry={supplyState.retry}>Failed to fetch supply</StatsMessage>
            </StatsSection>
        );
    }

    if (supplyState.kind === 'unavailable') {
        return (
            <StatsSection title="Circulating Supply">
                <StatsMessage>Supply is unavailable for this cluster</StatsMessage>
            </StatsSection>
        );
    }

    const { supply } = supplyState;

    // A card reading 0 of 0 looks like a bug, and it is the share below that would divide by it.
    if (supply.total === 0n) {
        return undefined;
    }

    const circulatingPercentage = percentage(supply.circulating, supply.total, 2).toFixed(1);

    return (
        <div className={GRID_CLASS}>
            <StatsSection title="Circulating Supply">
                <StatsFigure value={supply.circulating} total={supply.total}>
                    {circulatingPercentage}% <span className="text-outer-space-300">is circulating</span>
                </StatsFigure>
            </StatsSection>
            <ActiveStakeCard totalSupply={supply.total} voteAccounts={voteAccounts} />
        </div>
    );
}

const GRID_CLASS = 'grid gap-x-6 gap-y-9 sm:grid-cols-2';

/** Nothing spins on a request that already failed. */
function ActiveStakeCard({ totalSupply, voteAccounts }: { totalSupply: bigint; voteAccounts: VoteAccountsState }) {
    if (voteAccounts.kind === 'failed') {
        return (
            <StatsSection title="Active Stake">
                <StatsMessage retry={voteAccounts.retry}>Failed to fetch staking data</StatsMessage>
            </StatsSection>
        );
    }

    if (voteAccounts.kind === 'loading') {
        return (
            <StatsSection title="Active Stake">
                <LoadingStatsCard title="Loading staking data" />
            </StatsSection>
        );
    }

    const { active, delinquent } = voteAccounts.stake;

    // Nothing is delinquent out of nothing.
    const delinquentStakePercentage = active > 0n ? percentage(delinquent, active, 2).toFixed(1) : undefined;

    return (
        <StatsSection title="Active Stake">
            <StatsFigure value={active} total={totalSupply}>
                {delinquentStakePercentage && (
                    <>
                        <span className="text-outer-space-300">Delinquent stake:</span> {delinquentStakePercentage}%
                    </>
                )}
            </StatsFigure>
        </StatsSection>
    );
}

function StatsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <CollapsibleSection title={title} collapsible={false} fill>
            {children}
        </CollapsibleSection>
    );
}

/** The figure in the primary colour, the total it is measured against and the caption in the secondary one. */
function StatsFigure({ value, total, children }: { value: bigint; total: bigint; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 px-3 py-4">
            <div className="text-3xl leading-none">
                {displayLamports(value)}{' '}
                <span className="text-base text-outer-space-300">/ {displayLamports(total)}</span>
            </div>
            {children && <div className="text-sm">{children}</div>}
        </div>
    );
}

function StatsMessage({ retry, children }: { retry?: () => void; children: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-3 p-6 text-center text-sm">
            {children}
            {retry && (
                <Button variant="outline" size="sm" onClick={retry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}

const LoadingStatsCard = ({ title }: { title: string }) => {
    return (
        <div className="flex items-center justify-center gap-2 p-6 text-sm text-outer-space-300">
            <span className="spinner-grow spinner-grow-sm shrink-0" />
            {title}
        </div>
    );
};

function displayLamports(value: number | bigint) {
    return abbreviatedNumber(lamportsToSol(value));
}
