import { Slot } from '@components/common/Slot';

import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { Vote, VoteAccount } from '../lib/validators';

const COLUMNS: ReadonlyArray<GridTableColumn<Vote>> = [
    {
        cellClassName: 'whitespace-nowrap font-mono',
        header: 'Slot',
        render: vote => <Slot slot={vote.slot} link />,
    },
    {
        cellClassName: 'font-mono',
        header: 'Confirmation Count',
        render: vote => vote.confirmationCount,
    },
];

export function VotesCard({ voteAccount }: { voteAccount: VoteAccount }) {
    const votes = [...voteAccount.info.votes].reverse();

    return (
        <GridTableCard
            title="Vote History"
            ariaLabel="Vote history"
            gridTemplate="grid-cols-[clamp(132px,25%,200px)_1fr]"
            columns={COLUMNS}
            rows={votes}
            getRowKey={vote => vote.slot}
            empty="No votes found"
        />
    );
}
