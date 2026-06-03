import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

import { BaseTable, type BaseTableProps } from './BaseTable';

// Pairs <BaseTable> with the dashkit `table-responsive` scroll container and the `card-table` class
// applied to the inner table. Use inside a <BaseCard ui="dashkit"> body. See BaseTable for the `ui`
// rationale.
const wrapperVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit: 'table-responsive mb-0',
            tw: 'e-overflow-x-auto e-mb-0',
        },
    },
});

// Mirrors `.card-table` per app/scss/dashkit/_card.scss: zero thead border-top, and the first/last
// cell of each row gets card-spacer-x horizontal padding so the table aligns with the card edges.
const innerTableVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit: 'card-table',
            tw: [
                'e-mb-0',
                '[&_thead_th]:e-border-t-0',
                '[&_thead_th:first-child]:e-pl-6 [&_thead_th:last-child]:e-pr-6',
                '[&_tbody_td:first-child]:e-pl-6 [&_tbody_td:last-child]:e-pr-6',
            ].join(' '),
        },
    },
});

export interface BaseCardTableProps extends BaseTableProps {}

const BaseCardTable = React.forwardRef<HTMLTableElement, BaseCardTableProps>(
    ({ children, className, nowrap, ui, ...tableProps }, ref) => (
        <div className={cn(wrapperVariants({ ui }))}>
            <BaseTable
                ref={ref}
                nowrap={nowrap}
                ui={ui}
                className={cn(innerTableVariants({ ui }), className)}
                {...tableProps}
            >
                {children}
            </BaseTable>
        </div>
    ),
);
BaseCardTable.displayName = 'BaseCardTable';

export { BaseCardTable };
