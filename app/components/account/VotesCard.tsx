import { Slot } from '@components/common/Slot';
import { Vote, VoteAccount } from '@validators/accounts/vote';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function VotesCard({ voteAccount }: { voteAccount: VoteAccount }) {
    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Vote History
                    </CardTitle>
                </CardHeader>
                <BaseTable ui="dashkit" variant="card" nowrap>
                    <BaseTable.Head>
                        <BaseTable.Row>
                            <BaseTable.HeaderCell className="e-w-px e-text-dk-gray-700">Slot</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">
                                Confirmation Count
                            </BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body>
                        {voteAccount.info.votes.length > 0 &&
                            voteAccount.info.votes.reverse().map((vote: Vote, index) => renderAccountRow(vote, index))}
                    </BaseTable.Body>
                </BaseTable>

                <CardFooter ui="dashkit">
                    <div className="e-text-center e-text-dk-gray-700">
                        {voteAccount.info.votes.length > 0 ? '' : 'No votes found'}
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}

const renderAccountRow = (vote: Vote, index: number) => {
    return (
        <BaseTable.Row key={index}>
            <BaseTable.Cell className="e-w-px e-font-mono">
                <Slot slot={vote.slot} link />
            </BaseTable.Cell>
            <BaseTable.Cell className="e-font-mono">{vote.confirmationCount}</BaseTable.Cell>
        </BaseTable.Row>
    );
};
