import { cva, type VariantProps } from 'class-variance-authority';
import React, { type ReactNode } from 'react';

import { CollapsibleSection } from '@/app/components/shared/ui/collapsible-section';
import { cn } from '@/app/components/shared/utils';
import { Card } from '@/app/shared/ui/Card';

type CellVariants = Omit<VariantProps<typeof cellVariants>, 'role'>;

export type GridTableColumn<T> = {
    header: ReactNode;
    cell?: CellVariants;
    cellClassName?: string;
    render: (row: T) => ReactNode;
};

export type GridTableProps<T> = {
    ariaLabel: string;
    gridTemplate: string;
    columns: ReadonlyArray<GridTableColumn<T>>;
    rows: ReadonlyArray<T>;
    getRowKey: (row: T, index: number) => React.Key;
    empty?: ReactNode;
    className?: string;
};

const cellVariants = cva('flex px-3 py-2.5', {
    defaultVariants: { font: 'sans', justify: 'start', role: 'body', shrink: false, wrap: 'normal' },
    variants: {
        font: { mono: 'font-mono', sans: '' },
        justify: { center: 'justify-center', start: '' },
        role: {
            body: 'items-start border-t border-solid border-outer-space-800',
            header: 'items-center whitespace-nowrap text-xs uppercase text-outer-space-300',
        },
        shrink: { false: '', true: 'min-w-0' },
        wrap: { break: 'break-all', normal: '', nowrap: 'whitespace-nowrap' },
    },
});

export function GridTable<T>({
    ariaLabel,
    gridTemplate,
    columns,
    rows,
    getRowKey,
    empty = 'No data',
    className,
}: GridTableProps<T>) {
    return (
        <div className={cn('w-full overflow-x-auto text-sm text-white', className)}>
            <div role="table" aria-label={ariaLabel} className={cn('grid min-w-full', gridTemplate)}>
                <div role="row" className="contents">
                    {columns.map((column, index) => (
                        <div key={index} role="columnheader" className={cellVariants({ role: 'header' })}>
                            {column.header}
                        </div>
                    ))}
                </div>
                {rows.length > 0 ? (
                    rows.map((row, rowIndex) => (
                        <div key={getRowKey(row, rowIndex)} role="row" className="contents">
                            {columns.map((column, index) => (
                                <div
                                    key={index}
                                    role="cell"
                                    className={cn(cellVariants({ ...column.cell, role: 'body' }), column.cellClassName)}
                                >
                                    {column.render(row)}
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div role="row" className="contents">
                        <div
                            role="cell"
                            className="col-span-full border-t border-solid border-outer-space-800 px-3 py-2.5 text-center text-outer-space-300"
                        >
                            {empty}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function GridTableCard<T>({
    id,
    title,
    actions,
    collapsible,
    defaultExpanded,
    footer,
    ...grid
}: GridTableProps<T> & {
    id?: string;
    title: ReactNode;
    actions?: ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    footer?: ReactNode;
}) {
    return (
        <CollapsibleSection
            id={id}
            title={title}
            actions={actions}
            collapsible={collapsible}
            defaultExpanded={defaultExpanded}
            className=""
        >
            <Card variant="tight" className="rounded-lg border-outer-space-800 bg-outer-space-900">
                <GridTable {...grid} />
            </Card>
            {footer}
        </CollapsibleSection>
    );
}
