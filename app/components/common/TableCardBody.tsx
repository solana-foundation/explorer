import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/app/components/shared/utils';

const tableVariants = cva(['table table-sm card-table [&>tbody>tr:first-child>td]:!e-border-t-0'], {
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
}

export function TableCardBody({ children, className, ...props }: TableCardBodyProps) {
    return (
        // TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table
        <div className={cn('table-responsive e-mb-0', className)}>
            <table className={tableVariants(props)}>
                <tbody className="list">{children}</tbody>
            </table>
        </div>
    );
}

export interface TableCardBodyProps extends VariantProps<typeof tableVariants>, React.PropsWithChildren {
    headerComponent?: React.ReactNode;
}

export function TableCardBodyHeaded({ children, className, headerComponent, ...props }: TableCardBodyProps) {
    return (
        // TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table
        <div className={cn('table-responsive e-mb-0', className)}>
            <table className={tableVariants(props)}>
                {headerComponent ? <thead>{headerComponent}</thead> : null}
                <tbody className="list">{children}</tbody>
            </table>
        </div>
    );
}
