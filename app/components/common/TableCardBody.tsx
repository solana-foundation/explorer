import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

type TableLayout = 'compact' | 'expanded';

export interface TableCardBodyProps extends React.PropsWithChildren {
    className?: string;
    layout?: TableLayout;
}

export function TableCardBody({ children, className, layout = 'compact' }: TableCardBodyProps) {
    return (
        <BaseTable ui="dashkit" variant="card" nowrap={layout === 'compact'} className={className}>
            <BaseTable.Body className="list">{children}</BaseTable.Body>
        </BaseTable>
    );
}

export interface TableCardBodyHeadedProps extends TableCardBodyProps {
    headerComponent?: React.ReactNode;
}

export function TableCardBodyHeaded({
    children,
    className,
    headerComponent,
    layout = 'compact',
}: TableCardBodyHeadedProps) {
    return (
        <BaseTable ui="dashkit" variant="card" nowrap={layout === 'compact'} className={className}>
            {headerComponent ? <BaseTable.Head>{headerComponent}</BaseTable.Head> : null}
            <BaseTable.Body className="list">{children}</BaseTable.Body>
        </BaseTable>
    );
}
