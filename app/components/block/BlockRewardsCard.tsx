import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { PublicKey, VersionedBlockResponse } from '@solana/web3.js';
import React from 'react';

import { CardFooter, CardHeader } from '@/app/shared/ui/Card';

const PAGE_SIZE = 10;

export function BlockRewardsCard({ block }: { block: VersionedBlockResponse }) {
    const [rewardsDisplayed, setRewardsDisplayed] = React.useState(PAGE_SIZE);

    if (!block.rewards || block.rewards.length < 1) {
        return null;
    }

    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <h3 className="card-header-title">Block Rewards</h3>
            </CardHeader>

            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted">Address</th>
                            <th className="text-muted">Type</th>
                            <th className="text-muted">Amount</th>
                            <th className="text-muted">New Balance</th>
                            <th className="text-muted">Percent Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {block.rewards.map((reward, index) => {
                            if (index >= rewardsDisplayed - 1) {
                                return null;
                            }

                            let percentChange;
                            if (reward.postBalance !== null && reward.postBalance !== 0) {
                                percentChange = (
                                    (Math.abs(reward.lamports) / (reward.postBalance - reward.lamports)) *
                                    100
                                ).toFixed(9);
                            }
                            return (
                                <tr key={reward.pubkey + reward.rewardType}>
                                    <td>
                                        <Address pubkey={new PublicKey(reward.pubkey)} link />
                                    </td>
                                    <td>{reward.rewardType}</td>
                                    <td>
                                        <SolBalance lamports={reward.lamports} />
                                    </td>
                                    <td>{reward.postBalance ? <SolBalance lamports={reward.postBalance} /> : '-'}</td>
                                    <td>{percentChange ? `${percentChange}%` : '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {block.rewards.length > rewardsDisplayed && (
                <CardFooter ui="dashkit">
                    <button
                        className="btn btn-primary e-w-full"
                        onClick={() => setRewardsDisplayed(displayed => displayed + PAGE_SIZE)}
                    >
                        Load More
                    </button>
                </CardFooter>
            )}
        </div>
    );
}
