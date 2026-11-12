import type { FormattedIdl } from '@entities/idl';

import { GridTable, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { BaseIdlDoc } from './BaseIdlDoc';
import { BaseIdlFields } from './BaseIdlFields';
import { HighlightNode } from './HighlightNode';
import type { FormattedIdlDataView } from './types';

type PdaRow = NonNullable<FormattedIdl['pdas']>[number];

const COLUMNS: ReadonlyArray<GridTableColumn<PdaRow>> = [
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Name</span>,
        render: pda => (
            <div>
                <HighlightNode className="rounded py-0.5">{pda.name}</HighlightNode>
                <BaseIdlDoc docs={pda.docs} />
            </div>
        ),
    },
    {
        cell: { font: 'mono', wrap: 'nowrap' },
        cellClassName: 'text-xs',
        header: <span className="text-neutral-500">Seeds</span>,
        render: pda => (
            <div className="flex flex-col flex-wrap items-start justify-start gap-2">
                {pda.seeds.map((seed, i) => (
                    <div key={i} className="flex">
                        <BaseIdlFields fieldType={seed} />
                    </div>
                ))}
            </div>
        ),
    },
];

export function BaseIdlPdas({ data }: FormattedIdlDataView<'pdas'>) {
    if (!data) return null;
    return (
        <GridTable
            ariaLabel="IDL PDAs"
            gridTemplate="grid-cols-[auto_1fr]"
            columns={COLUMNS}
            rows={data}
            getRowKey={pda => pda.name}
            empty={null}
            mobile="stack"
        />
    );
}
