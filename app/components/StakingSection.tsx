'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { useSupply } from '@features/supply';
import { useVoteAccounts, type VoteAccountsState } from '@features/vote/model/vote-accounts'; // deep import on purpose: the barrel pulls the vote instruction cards into the home bundle for one hook
import { abbreviatedNumber, lamportsToSol } from '@utils/index';
import { percentage } from '@utils/math';

import { Card, CardBody } from '@/app/shared/ui/Card';

import { SimpleCardSkeleton } from './shared/Skeletons';

// Stake is drawn against total supply, so it cannot render before supply does. The wait is one-way: once
// supply is in hand its card stays up while stake is still coming.
export function StakingSection() {
    const supplyState = useSupply();
    const voteAccounts = useVoteAccounts();

    if (supplyState.kind === 'loading') {
        return (
            <div className="flex flex-col md:flex-row md:gap-6">
                <SimpleCardSkeleton title={<LoadingStatsCard title="Loading supply data" />} />
                <SimpleCardSkeleton title={<LoadingStatsCard title="Loading staking data" />} />
            </div>
        );
    }

    // Supply alone: the staking card owns its own retry, and it is not on screen in either branch.
    if (supplyState.kind === 'failed') {
        return <ErrorCard text="Failed to fetch supply" retry={supplyState.retry} />;
    }

    if (supplyState.kind === 'unavailable') {
        return <ErrorCard text="Supply is unavailable for this cluster" />;
    }

    const { supply } = supplyState;

    // A card reading 0 of 0 looks like a bug, and it is the share below that would divide by it.
    if (supply.total === 0n) {
        return undefined;
    }

    const circulatingPercentage = percentage(supply.circulating, supply.total, 2).toFixed(1);

    return (
        <div className="flex flex-col md:flex-row md:gap-6">
            <div className="w-full md:w-1/2">
                <Card ui="dashkit" className="mb-3 md:mb-6">
                    <CardBody ui="dashkit">
                        <h4>Circulating Supply</h4>
                        <h1 className="mb-3">
                            <em className="not-italic text-dark-accent">{displayLamports(supply.circulating)}</em> /{' '}
                            <small className="text-base">{displayLamports(supply.total)}</small>
                        </h1>
                        <h5 className="mb-0">
                            <em className="not-italic text-dark-accent">{circulatingPercentage}%</em> is circulating
                        </h5>
                    </CardBody>
                </Card>
            </div>
            <div className="w-full md:w-1/2">
                <ActiveStakeCard totalSupply={supply.total} voteAccounts={voteAccounts} />
            </div>
        </div>
    );
}

/** Nothing spins on a request that already failed. */
function ActiveStakeCard({ totalSupply, voteAccounts }: { totalSupply: bigint; voteAccounts: VoteAccountsState }) {
    if (voteAccounts.kind === 'failed') {
        return <ErrorCard text="Failed to fetch staking data" retry={voteAccounts.retry} />;
    }

    if (voteAccounts.kind === 'loading') {
        return <SimpleCardSkeleton title={<LoadingStatsCard title="Loading staking data" />} />;
    }

    const { active, delinquent } = voteAccounts.stake;

    // Nothing is delinquent out of nothing.
    const delinquentStakePercentage = active > 0n ? percentage(delinquent, active, 2).toFixed(1) : undefined;

    return (
        <Card ui="dashkit" className="mb-3 md:mb-6">
            <CardBody ui="dashkit">
                <h4>Active Stake</h4>
                <h1 className="mb-3">
                    <em className="not-italic text-dark-accent">{displayLamports(active)}</em> /{' '}
                    <small className="text-base">{displayLamports(totalSupply)}</small>
                </h1>
                {delinquentStakePercentage && (
                    <h5 className="mb-0">
                        Delinquent stake: <em className="not-italic text-dark-accent">{delinquentStakePercentage}%</em>
                    </h5>
                )}
            </CardBody>
        </Card>
    );
}

const LoadingStatsCard = ({ title }: { title: string }) => {
    return (
        <div className="flex items-center gap-2">
            <span className="spinner-grow spinner-grow-sm shrink-0" />
            {title}
        </div>
    );
};

function displayLamports(value: number | bigint) {
    return abbreviatedNumber(lamportsToSol(value));
}
