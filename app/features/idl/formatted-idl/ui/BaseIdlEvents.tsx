import type { FormattedIdl } from '@entities/idl';

import { GridTable, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type EventRow = NonNullable<FormattedIdl['events']>[number];

const COLUMNS: ReadonlyArray<GridTableColumn<EventRow>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Name</span>,
        render: event => (
            <div>
                <HighlightNode className="rounded py-0.5">{event.name}</HighlightNode>
                <BaseIdlDoc docs={event.docs} />
            </div>
        ),
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Fields</span>,
        render: event => <BaseIdlFields fieldType={event.fieldType} />,
    },
];

export function BaseIdlEvents({ data }: FormattedIdlDataView<'events'>) {
    if (!data) return null;
    return (
        <GridTable
            ariaLabel="IDL events"
            gridTemplate="grid-cols-[auto_1fr]"
            columns={COLUMNS}
            rows={data}
            getRowKey={event => event.name}
            empty={null}
            mobile="stack"
        />
    );
}
