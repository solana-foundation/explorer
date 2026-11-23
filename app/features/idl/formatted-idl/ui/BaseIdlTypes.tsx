import type { FormattedIdl } from '@entities/idl';

import { GridTable, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type TypeRow = NonNullable<FormattedIdl['types']>[number];

const COLUMNS: ReadonlyArray<GridTableColumn<TypeRow>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Name</span>,
        render: typeItem => (
            <div>
                <span className="flex items-center gap-2">
                    <i className="text-neutral-500">{typeItem.fieldType?.kind}</i>
                    <HighlightNode className="rounded">{typeItem.name}</HighlightNode>
                </span>
                <BaseIdlDoc docs={typeItem.docs} />
            </div>
        ),
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Fields</span>,
        render: typeItem => <BaseIdlFields fieldType={typeItem.fieldType} />,
    },
];

export function BaseIdlTypes({ data }: FormattedIdlDataView<'types'>) {
    if (!data) return null;
    return (
        <GridTable
            ariaLabel="IDL types"
            gridTemplate="grid-cols-[auto_1fr]"
            columns={COLUMNS}
            rows={data}
            getRowKey={typeItem => typeItem.name}
            empty={null}
            mobile="stack"
        />
    );
}
