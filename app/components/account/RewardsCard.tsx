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

import { CardBody, CardFooter, CardHeader } from '@/app/shared/ui/Card';

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
            <tr key={reward.epoch}>
                <td>
                    <Epoch epoch={reward.epoch} link />
                </td>
                <td>
                    <Slot slot={reward.effectiveSlot} link />
                </td>
                <td>{lamportsToSolString(reward.amount)}</td>
                <td>{lamportsToSolString(reward.postBalance)}</td>
            </tr>
        );
    });
    const rewardsFound = rewardsList.some(r => r);
    const { foundOldest, lowestFetchedEpoch, highestFetchedEpoch } = rewards.data;
    const fetching = rewards.status === FetchStatus.Fetching;

    return (
        <>
            <div className="card">
                <CardHeader ui="dashkit">
                    <div className="row e-items-center">
                        <div className="col">
                            <h3 className="card-header-title">Rewards</h3>
                        </div>
                    </div>
                </CardHeader>

                {rewardsFound ? (
                    // TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table
                    <div className="table-responsive e-mb-0">
                        <table className="table table-sm table-nowrap card-table">
                            <thead>
                                <tr>
                                    <th className="w-1 text-muted">Epoch</th>
                                    <th className="text-muted">Effective Slot</th>
                                    <th className="text-muted">Reward Amount</th>
                                    <th className="text-muted">Post Balance</th>
                                </tr>
                            </thead>
                            <tbody className="list">{rewardsList}</tbody>
                        </table>
                    </div>
                ) : (
                    <CardBody ui="dashkit">
                        No rewards issued between epochs {lowestFetchedEpoch} and {highestFetchedEpoch}
                    </CardBody>
                )}

                <CardFooter ui="dashkit">
                    {foundOldest ? (
                        <div className="e-text-center e-text-dk-gray-700">Fetched full reward history</div>
                    ) : (
                        <button className="btn btn-primary e-w-full" onClick={() => loadMore()} disabled={fetching}>
                            {fetching ? (
                                <>
                                    <span className="e-spinner-grow e-spinner-grow-sm e-mr-1.5 e-align-text-top"></span>
                                    Loading
                                </>
                            ) : (
                                'Load More'
                            )}
                        </button>
                    )}
                </CardFooter>
            </div>
        </>
    );
}
