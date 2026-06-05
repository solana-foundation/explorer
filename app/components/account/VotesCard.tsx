import { Slot } from '@components/common/Slot';
import { Vote, VoteAccount } from '@validators/accounts/vote';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function VotesCard({ voteAccount }: { voteAccount: VoteAccount }) {
    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Vote History
                    </CardTitle>
                </CardHeader>

                {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
                <div className="table-responsive e-mb-0">
                    <table className="table table-sm table-nowrap card-table">
                        <thead>
                            <tr>
                                <th className="w-1 text-muted">Slot</th>
                                <th className="text-muted">Confirmation Count</th>
                            </tr>
                        </thead>
                        <tbody className="list">
                            {voteAccount.info.votes.length > 0 &&
                                voteAccount.info.votes
                                    .reverse()
                                    .map((vote: Vote, index) => renderAccountRow(vote, index))}
                        </tbody>
                    </table>
                </div>

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
        <tr key={index}>
            <td className="w-1 font-monospace">
                <Slot slot={vote.slot} link />
            </td>
            <td className="font-monospace">{vote.confirmationCount}</td>
        </tr>
    );
};
