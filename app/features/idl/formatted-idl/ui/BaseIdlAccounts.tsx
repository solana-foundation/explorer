import type { FormattedIdl } from '@entities/idl';

import { GridTable, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type AccountRow = NonNullable<FormattedIdl['accounts']>[number];

const COLUMNS: ReadonlyArray<GridTableColumn<AccountRow>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Name</span>,
        render: acc => (
            <div>
                <HighlightNode className="rounded py-0.5">{acc.name}</HighlightNode>
                <BaseIdlDoc docs={acc.docs} />
            </div>
        ),
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Fields</span>,
        render: acc => <BaseIdlFields fieldType={acc.fieldType} />,
    },
];

export function BaseIdlAccounts({ data }: FormattedIdlDataView<'accounts'>) {
    if (!data) return null;
    return (
        <GridTable
            ariaLabel="IDL accounts"
            gridTemplate="grid-cols-[auto_1fr]"
            columns={COLUMNS}
            rows={data}
            getRowKey={acc => acc.name}
            empty={null}
            mobile="stack"
        />
    );
}
