'use client';

import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { isParsedAccountProgram, STAKE_PROGRAM_LABEL } from '@explorer/parsers';
import { useAccountInfo } from '@providers/accounts';
import { useFetchRewards, useRewards } from '@providers/accounts/rewards';
import { FetchStatus } from '@providers/cache';
import { InflationReward, PublicKey } from '@solana/web3.js';
import { lamportsToSolString } from '@utils/index';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

const U64_MAX = BigInt('0xffffffffffffffff');

const COLUMNS: ReadonlyArray<GridTableColumn<InflationReward>> = [
    {
        header: 'Epoch',
        render: reward => <Epoch epoch={reward.epoch} link />,
    },
    {
        header: 'Effective Slot',
        render: reward => <Slot slot={reward.effectiveSlot} link />,
    },
    {
        header: 'Reward Amount',
        render: reward => lamportsToSolString(reward.amount),
    },
    {
        header: 'Post Balance',
        render: reward => lamportsToSolString(reward.postBalance),
    },
];

export function RewardsCard({ address }: { address: string }) {
    const pubkey = React.useMemo(() => new PublicKey(address), [address]);
    const info = useAccountInfo(address);
    const account = info?.data;
    const parsedData = account?.data.parsed;

    const highestEpoch = React.useMemo(() => {
        if (!isParsedAccountProgram(parsedData, STAKE_PROGRAM_LABEL)) return;
        const stakeInfo = parsedData.parsed.info.stake;
        if (stakeInfo !== null && stakeInfo.delegation.deactivationEpoch !== U64_MAX) {
            return Number(stakeInfo.delegation.deactivationEpoch);
        }
    }, [parsedData]);

    const rewards = useRewards(address);
    const fetchRewards = useFetchRewards();
    const loadMore = () => fetchRewards(pubkey, highestEpoch);

    React.useEffect(() => {
        if (!rewards) {
            fetchRewards(pubkey, highestEpoch);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!rewards) {
        return null;
    }

    if (rewards?.data === undefined) {
        if (rewards.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading rewards" />;
        }

        return <ErrorCard retry={loadMore} text="Failed to fetch rewards" />;
    }

    const rewardsRows = rewards.data.rewards.filter((reward): reward is InflationReward => Boolean(reward));
    const { foundOldest, lowestFetchedEpoch, highestFetchedEpoch } = rewards.data;
    const fetching = rewards.status === FetchStatus.Fetching;

    const footer = (
        <div className="mt-2 w-full">
            {foundOldest ? (
                <div className="text-center text-outer-space-300">Fetched full reward history</div>
            ) : (
                <Button
                    ui="dashkit"
                    variant="primary"
                    className="w-full"
                    onClick={() => loadMore()}
                    disabled={fetching}
                >
                    {fetching ? (
                        <>
                            <span className="spinner-grow spinner-grow-sm mr-1.5 align-text-top"></span>
                            Loading
                        </>
                    ) : (
                        'Load More'
                    )}
                </Button>
            )}
        </div>
    );

    return (
        <GridTableCard
            title="Rewards"
            ariaLabel="Rewards"
            gridTemplate="grid-cols-[auto_auto_1fr_1fr]"
            columns={COLUMNS}
            rows={rewardsRows}
            getRowKey={reward => reward.epoch}
            empty={`No rewards issued between epochs ${lowestFetchedEpoch} and ${highestFetchedEpoch}`}
            footer={footer}
        />
    );
}
