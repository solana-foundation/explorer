'use client';

import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { useAccountInfo } from '@providers/accounts';
import { useFetchRewards, useRewards } from '@providers/accounts/rewards';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { lamportsToSolString } from '@utils/index';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

const U64_MAX = BigInt('0xffffffffffffffff');

export function RewardsCard({ address }: { address: string }) {
    const pubkey = React.useMemo(() => new PublicKey(address), [address]);
    const info = useAccountInfo(address);
    const account = info?.data;
    const parsedData = account?.data.parsed;

    const highestEpoch = React.useMemo(() => {
        if (!parsedData) return;
        if (parsedData.program !== 'stake') return;
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

    const rewardsList = rewards.data.rewards.map(reward => {
        if (!reward) {
            return null;
        }

        return (
            <BaseTable.Row key={reward.epoch}>
                <BaseTable.Cell>
                    <Epoch epoch={reward.epoch} link />
                </BaseTable.Cell>
                <BaseTable.Cell>
                    <Slot slot={reward.effectiveSlot} link />
                </BaseTable.Cell>
                <BaseTable.Cell>{lamportsToSolString(reward.amount)}</BaseTable.Cell>
                <BaseTable.Cell>{lamportsToSolString(reward.postBalance)}</BaseTable.Cell>
            </BaseTable.Row>
        );
    });
    const rewardsFound = rewardsList.some(r => r);
    const { foundOldest, lowestFetchedEpoch, highestFetchedEpoch } = rewards.data;
    const fetching = rewards.status === FetchStatus.Fetching;

    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Rewards
                    </CardTitle>
                </CardHeader>

                {rewardsFound ? (
                    <BaseTable ui="dashkit" variant="card" nowrap>
                        <BaseTable.Head>
                            <BaseTable.Row>
                                <BaseTable.HeaderCell className="w-px text-dk-gray-700">Epoch</BaseTable.HeaderCell>
                                <BaseTable.HeaderCell className="text-dk-gray-700">Effective Slot</BaseTable.HeaderCell>
                                <BaseTable.HeaderCell className="text-dk-gray-700">Reward Amount</BaseTable.HeaderCell>
                                <BaseTable.HeaderCell className="text-dk-gray-700">Post Balance</BaseTable.HeaderCell>
                            </BaseTable.Row>
                        </BaseTable.Head>
                        <BaseTable.Body>{rewardsList}</BaseTable.Body>
                    </BaseTable>
                ) : (
                    <CardBody ui="dashkit">
                        No rewards issued between epochs {lowestFetchedEpoch} and {highestFetchedEpoch}
                    </CardBody>
                )}

                <CardFooter ui="dashkit">
                    {foundOldest ? (
                        <div className="text-center text-dk-gray-700">Fetched full reward history</div>
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
                </CardFooter>
            </Card>
        </>
    );
}
