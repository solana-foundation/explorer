import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { SolBalance } from '@components/common/SolBalance';

import { Badge } from '@/app/components/shared/ui/badge';
import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

import type { SolBalanceChange } from '../lib/types';

const COLUMNS: ReadonlyArray<GridTableColumn<{ change: SolBalanceChange; index: number }>> = [
    {
        header: '#',
        render: ({ index }) => (
            <Badge ui="dashkit" variant="info" className="mr-[3px]">
                {index + 1}
            </Badge>
        ),
    },
    {
        header: 'Address',
        render: ({ change }) => <Address pubkey={change.pubkey} link fetchTokenLabelInfo />,
    },
    {
        header: 'Change (SOL)',
        render: ({ change }) => <BalanceDelta delta={change.delta} isSol />,
    },
    {
        header: 'Post Balance (SOL)',
        render: ({ change }) => <SolBalance lamports={BigInt(change.postBalance.toString())} />,
    },
];

export function SolBalanceChangesCard({ balanceChanges }: { balanceChanges: SolBalanceChange[] }) {
    const rows = balanceChanges.map((change, index) => ({ change, index }));

    return (
        <GridTableCard
            title="SOL Balance Changes"
            ariaLabel="SOL balance changes"
            gridTemplate="grid-cols-[auto_1fr_auto_auto]"
            columns={COLUMNS}
            rows={rows}
            getRowKey={({ change }) => change.pubkey.toBase58()}
        />
    );
}
