import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/app/components/shared/utils';

const tableVariants = cva(['table table-sm card-table [&_tr:first-child_td]:!e-border-t-0'], {
    defaultVariants: {
        layout: 'compact',
    },
    variants: {
        layout: {
            compact: ['table-nowrap'],
            expanded: [],
        },
    },
});

export interface TableCardBodyProps extends VariantProps<typeof tableVariants>, React.PropsWithChildren {
    className?: string;
    headerComponent?: React.ReactNode;
}

export function TableCardBody({ children, className, ...props }: TableCardBodyProps) {
    return (
        // TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table
        <div className="table-responsive e-mb-0">
            <table className={cn(tableVariants(props), className)}>
                <tbody className="list">{children}</tbody>
            </table>
        </div>
    );
}

export function TableCardBodyHeaded({ children, className, headerComponent, ...props }: TableCardBodyProps) {
    return (
        // TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table
        <div className="table-responsive e-mb-0">
            <table className={cn(tableVariants(props), className)}>
                {headerComponent ? <thead>{headerComponent}</thead> : null}
                <tbody className="list">{children}</tbody>
            </table>
        </div>
    );
}
