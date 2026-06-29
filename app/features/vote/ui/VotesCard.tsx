import { Slot } from '@components/common/Slot';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { Vote, VoteAccount } from '../lib/validators';

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
                            <BaseTable.HeaderCell className="w-px text-dk-gray-700">Slot</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="text-dk-gray-700">Confirmation Count</BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body>
                        {voteAccount.info.votes.length > 0 &&
                            [...voteAccount.info.votes].reverse().map(vote => renderAccountRow(vote))}
                    </BaseTable.Body>
                </BaseTable>

                <CardFooter ui="dashkit">
                    <div className="text-center text-dk-gray-700">
                        {voteAccount.info.votes.length > 0 ? '' : 'No votes found'}
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}

const renderAccountRow = (vote: Vote) => {
    return (
        <BaseTable.Row key={vote.slot}>
            <BaseTable.Cell className="w-px font-mono">
                <Slot slot={vote.slot} link />
            </BaseTable.Cell>
            <BaseTable.Cell className="font-mono">{vote.confirmationCount}</BaseTable.Cell>
        </BaseTable.Row>
    );
};
