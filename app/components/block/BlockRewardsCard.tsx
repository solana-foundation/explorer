import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { PublicKey, VersionedBlockResponse } from '@solana/web3.js';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

const PAGE_SIZE = 10;

export function BlockRewardsCard({ block }: { block: VersionedBlockResponse }) {
    const [rewardsDisplayed, setRewardsDisplayed] = React.useState(PAGE_SIZE);

    if (!block.rewards || block.rewards.length < 1) {
        return null;
    }

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Block Rewards
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-muted">Address</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Type</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Amount</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">New Balance</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Percent Change</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
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
                            <BaseTable.Row key={reward.pubkey + reward.rewardType}>
                                <BaseTable.Cell>
                                    <Address pubkey={new PublicKey(reward.pubkey)} link />
                                </BaseTable.Cell>
                                <BaseTable.Cell>{reward.rewardType}</BaseTable.Cell>
                                <BaseTable.Cell>
                                    <SolBalance lamports={reward.lamports} />
                                </BaseTable.Cell>
                                <BaseTable.Cell>
                                    {reward.postBalance ? <SolBalance lamports={reward.postBalance} /> : '-'}
                                </BaseTable.Cell>
                                <BaseTable.Cell>{percentChange ? `${percentChange}%` : '-'}</BaseTable.Cell>
                            </BaseTable.Row>
                        );
                    })}
                </BaseTable.Body>
            </BaseTable>

            {block.rewards.length > rewardsDisplayed && (
                <CardFooter ui="dashkit">
                    <Button
                        ui="dashkit"
                        variant="primary"
                        className="e-w-full"
                        onClick={() => setRewardsDisplayed(displayed => displayed + PAGE_SIZE)}
                    >
                        Load More
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
