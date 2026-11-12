import type { FormattedIdl } from '@entities/idl';

import { GridTable, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type ErrorRow = NonNullable<FormattedIdl['errors']>[number];

const COLUMNS: ReadonlyArray<GridTableColumn<ErrorRow>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs text-neutral-500',
        header: <span className="text-neutral-500">Code</span>,
        render: err => <HighlightNode className="rounded">{err.code}</HighlightNode>,
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Name</span>,
        render: err => <HighlightNode className="rounded py-0.5">{err.name}</HighlightNode>,
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Message</span>,
        render: err => <HighlightNode className="rounded py-0.5">{err.message}</HighlightNode>,
    },
];

export function BaseIdlErrors({ data }: FormattedIdlDataView<'errors'>) {
    if (!data) return null;
    return (
        <GridTable
            ariaLabel="IDL errors"
            gridTemplate="grid-cols-[auto_1fr_1fr]"
            columns={COLUMNS}
            rows={data}
            getRowKey={err => err.code}
            empty={null}
            mobile="stack"
        />
    );
}
