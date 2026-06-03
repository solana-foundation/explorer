import { Slot } from '@components/common/Slot';
import { Vote, VoteAccount } from '@validators/accounts/vote';
import React from 'react';

import { CardFooter, CardHeader } from '@/app/shared/ui/Card';

export function VotesCard({ voteAccount }: { voteAccount: VoteAccount }) {
    return (
        <>
            <div className="card">
                <CardHeader ui="dashkit">
                    <div className="row align-items-center">
                        <div className="col">
                            <h3 className="card-header-title">Vote History</h3>
                        </div>
                    </div>
                </CardHeader>

                {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
                <div className="table-responsive mb-0">
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
                    <div className="text-muted text-center">
                        {voteAccount.info.votes.length > 0 ? '' : 'No votes found'}
                    </div>
                </CardFooter>
            </div>
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
