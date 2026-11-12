import { Slot } from '@components/common/Slot';
import { TruncatedValue } from '@components/shared/TruncatedValue';
import { SlotHashEntry, SlotHashesInfo, SysvarAccount } from '@validators/accounts/sysvar';
import React from 'react';

import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

const COLUMNS: ReadonlyArray<GridTableColumn<SlotHashEntry>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        header: 'Slot',
        render: entry => <Slot slot={entry.slot} link />,
    },
    {
        // The hash wraps (`break-all`) instead of truncating or scrolling on phones; it still fits on one
        // line on desktop. `shrink` (`min-w-0`) lets the `1fr` track shrink below the hash width.
        cell: { font: 'mono', shrink: true, wrap: 'break' },
        header: 'Hash',
        render: entry => <TruncatedValue value={entry.hash} truncation={{ enabled: false }} alignItems="start" />,
    },
];

export function SlotHashesCard({ sysvarAccount }: { sysvarAccount: SysvarAccount }) {
    const slotHashes = sysvarAccount.info as SlotHashesInfo;

    return (
        <GridTableCard
            title="Slot Hashes"
            ariaLabel="Slot hashes"
            gridTemplate="grid-cols-[clamp(132px,25%,200px)_1fr]"
            columns={COLUMNS}
            rows={slotHashes}
            getRowKey={entry => entry.slot}
            empty="No hashes found"
        />
    );
}
