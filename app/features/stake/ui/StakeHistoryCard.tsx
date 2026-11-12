import { Epoch } from '@components/common/Epoch';
import { SolBalance } from '@components/common/SolBalance';
import type { StakeHistoryEntry, SysvarStakeHistoryAccount } from '@validators/accounts/sysvar';

import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

const COLUMNS: ReadonlyArray<GridTableColumn<StakeHistoryEntry>> = [
    {
        cell: { font: 'mono' },
        header: 'Epoch',
        render: entry => <Epoch epoch={entry.epoch} link />,
    },
    {
        cell: { font: 'mono' },
        header: 'Effective (SOL)',
        render: entry => <SolBalance lamports={entry.stakeHistory.effective} />,
    },
    {
        cell: { font: 'mono' },
        header: 'Activating (SOL)',
        render: entry => <SolBalance lamports={entry.stakeHistory.activating} />,
    },
    {
        cell: { font: 'mono' },
        header: 'Deactivating (SOL)',
        render: entry => <SolBalance lamports={entry.stakeHistory.deactivating} />,
    },
];

export function StakeHistoryCard({ sysvarAccount }: { sysvarAccount: SysvarStakeHistoryAccount }) {
    return (
        <GridTableCard
            title="Stake History"
            ariaLabel="Stake history"
            gridTemplate="grid-cols-[auto_1fr_1fr_1fr]"
            columns={COLUMNS}
            rows={sysvarAccount.info}
            getRowKey={entry => entry.epoch}
            empty="No stake history found"
        />
    );
}
