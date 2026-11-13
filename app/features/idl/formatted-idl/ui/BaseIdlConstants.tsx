import { Badge } from '@components/shared/ui/badge';
import type { FormattedIdl } from '@entities/idl';

import { GridTable, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type ConstantRow = NonNullable<FormattedIdl['constants']>[number];

const COLUMNS: ReadonlyArray<GridTableColumn<ConstantRow>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Name</span>,
        render: constant => (
            <div>
                <HighlightNode className="rounded py-0.5">{constant.name}</HighlightNode>
                <BaseIdlDoc docs={constant.docs} />
            </div>
        ),
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Value</span>,
        render: constant => (
            <HighlightNode className="inline-flex rounded">
                <div className="flex items-center gap-2">
                    <span className="py-0.5">{JSON.stringify(constant.value, undefined, 2)}:</span>
                    <Badge variant="success" size="xs">
                        {constant.type}
                    </Badge>
                </div>
            </HighlightNode>
        ),
    },
];

export function BaseIdlConstants({ data }: FormattedIdlDataView<'constants'>) {
    if (!data) return null;
    return (
        <GridTable
            ariaLabel="IDL constants"
            gridTemplate="grid-cols-[auto_1fr]"
            columns={COLUMNS}
            rows={data}
            getRowKey={constant => constant.name}
            empty={null}
            mobile="stack"
        />
    );
}
