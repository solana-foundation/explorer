import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';

const tableVariants = cva(['table table-sm card-table'], {
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

export interface TableCardBodyProps extends VariantProps<typeof tableVariants>, React.PropsWithChildren {}

export function TableCardBody({ children, ...props }: TableCardBodyProps) {
    return (
        <div className="table-responsive mb-0">
            <table className={tableVariants(props)}>
                <tbody className="list">{children}</tbody>
            </table>
        </div>
    );
}
