import { cva, type VariantProps } from 'class-variance-authority';
import React, { type ReactNode } from 'react';

import { CollapsibleSection } from '@/app/components/shared/ui/collapsible-section';
import { cn } from '@/app/components/shared/utils';
import { Card } from '@/app/shared/ui/Card';

type CellVariants = Omit<VariantProps<typeof cellVariants>, 'role'>;

export type GridTableColumn<T> = {
    header: ReactNode;
    // Falls back to `header` when the row stacks into labelled fields below `md` (see `mobile="stack"`).
    mobileLabel?: ReactNode;
    // Dropped from the stacked layout, e.g. a column whose content is folded into another field on mobile.
    hideOnMobile?: boolean;
    cell?: CellVariants;
    cellClassName?: string;
    render: (row: T) => ReactNode;
    // Overrides `render` in the stacked layout, e.g. to inline a hidden column's content.
    mobileRender?: (row: T) => ReactNode;
};

export type GridTableProps<T> = {
    ariaLabel: string;
    gridTemplate: string;
    columns: ReadonlyArray<GridTableColumn<T>>;
    rows: ReadonlyArray<T>;
    getRowKey: (row: T, index: number) => React.Key;
    empty?: ReactNode;
    className?: string;
    // `grid` (default) keeps the single grid on every breakpoint. `stack` drops each row into labelled
    // fields below `md` so tables too wide for a phone reflow instead of scrolling horizontally.
    mobile?: 'grid' | 'stack';
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
    mobile = 'grid',
}: GridTableProps<T>) {
    const grid = (
        <div
            className={cn(
                'w-full overflow-x-auto text-sm text-white',
                mobile === 'stack' && 'hidden md:block',
                className,
            )}
        >
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

    if (mobile !== 'stack') return grid;

    return (
        <>
            {grid}
            <div role="table" aria-label={ariaLabel} className="text-sm text-white md:hidden">
                {rows.length > 0 ? (
                    rows.map((row, rowIndex) => (
                        <div
                            key={getRowKey(row, rowIndex)}
                            role="row"
                            className="flex flex-col gap-1 border-t border-solid border-outer-space-800 px-3 py-3 first:border-t-0"
                        >
                            {columns
                                .filter(column => !column.hideOnMobile)
                                .map((column, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <span
                                            role="rowheader"
                                            className="w-[clamp(6rem,35%,11rem)] shrink-0 text-outer-space-300"
                                        >
                                            {column.mobileLabel ?? column.header}
                                        </span>
                                        <div role="cell" className="min-w-0 flex-1">
                                            {(column.mobileRender ?? column.render)(row)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ))
                ) : (
                    <div role="row" className="contents">
                        <div role="cell" className="px-3 py-3 text-center text-outer-space-300">
                            {empty}
                        </div>
                    </div>
                )}
            </div>
        </>
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
