import { RecentBlockhashesEntry, RecentBlockhashesInfo } from '@validators/accounts/sysvar';
import React from 'react';

import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

const COLUMNS: ReadonlyArray<GridTableColumn<{ entry: RecentBlockhashesEntry; index: number }>> = [
    {
        header: 'Recency',
        render: ({ index }) => index + 1,
    },
    {
        cellClassName: 'font-mono',
        header: 'Blockhash',
        render: ({ entry }) => entry.blockhash,
    },
    {
        header: 'Fee Calculator',
        render: ({ entry }) => `${entry.feeCalculator.lamportsPerSignature} lamports per signature`,
    },
];

export function BlockhashesCard({ blockhashes }: { blockhashes: RecentBlockhashesInfo }) {
    const rows = blockhashes.map((entry, index) => ({ entry, index }));

    return (
        <GridTableCard
            title="Blockhashes"
            ariaLabel="Blockhashes"
            gridTemplate="grid-cols-[auto_1fr_auto]"
            columns={COLUMNS}
            rows={rows}
            getRowKey={({ index }) => index}
            empty="No blockhashes found"
        />
    );
}
