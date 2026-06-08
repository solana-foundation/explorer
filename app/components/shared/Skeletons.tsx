import { ReactElement } from 'react';

import { Card, CardBody, CardHeader } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { Skeleton } from './ui/skeleton';

type ColDef = {
    skeleton: string;
    td?: string;
};

export function TableRowSkeleton({
    cols = [{ skeleton: 'e-h-4 e-w-36', td: 'e-w-full' }, { skeleton: 'e-h-4 e-w-20' }],
}: {
    cols?: ColDef[];
}) {
    return (
        <BaseTable.Row>
            {cols.map(({ skeleton, td }, i) => (
                <BaseTable.Cell key={i} className={td}>
                    <Skeleton className={skeleton} />
                </BaseTable.Cell>
            ))}
        </BaseTable.Row>
    );
}

export function RichRowSkeleton() {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <Skeleton className="e-mb-2 e-h-3 e-w-3/5" />
                <Skeleton className="e-mb-2 e-h-3 e-w-full" />
                <Skeleton className="e-h-3 e-w-2/5" />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function SimpleCardSkeleton({ withTitle = false, title }: { withTitle?: boolean; title?: ReactElement }) {
    return (
        <Card ui="dashkit" className="e-mb-3 e-w-full md:e-mb-6">
            {withTitle && (
                <CardHeader ui="dashkit">
                    {/* Wrapper absorbs CardHeader's [&>:first-child]:e-flex-1 so Skeleton's e-w-40 isn't stretched to full width. */}
                    <div>
                        <Skeleton className="e-h-5 e-w-40" />
                    </div>
                </CardHeader>
            )}
            <CardBody ui="dashkit">
                {title || <Skeleton className="e-h-5 e-w-3/5" />}
                <Skeleton className="e-mb-2.5 e-mt-2 e-h-7 e-w-full" />
                <Skeleton className="e-h-3 e-w-2/5" />
            </CardBody>
        </Card>
    );
}

export function RichListSkeleton({ rows = 2 }: { rows?: number }) {
    return (
        <Card ui="dashkit" flex="grow">
            <CardHeader ui="dashkit">
                {/* Wrapper absorbs CardHeader's [&>:first-child]:e-flex-1 so Skeleton's e-w-40 isn't stretched to full width. */}
                <div>
                    <Skeleton className="e-h-5 e-w-40" />
                </div>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body className="list">
                    {Array.from({ length: rows }).map((_, i) => (
                        <RichRowSkeleton key={i} />
                    ))}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}

export function StatsTableSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <Card ui="dashkit" flex="grow">
            <CardHeader ui="dashkit">
                {/* Wrapper absorbs CardHeader's [&>:first-child]:e-flex-1 so Skeleton's e-w-40 isn't stretched to full width. */}
                <div>
                    <Skeleton className="e-h-5 e-w-40" />
                </div>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body className="list">
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                    ))}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}

export function TableCardSkeleton({ cols = 4, rows = 6 }: { cols?: number; rows?: number }) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <Skeleton className="e-h-5 e-w-64" />
            </CardHeader>
            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive small-headers">
                <table className="table">
                    <BaseTable.Head>
                        <BaseTable.Row>
                            {Array.from({ length: cols }).map((_, i) => (
                                <BaseTable.HeaderCell key={i}>
                                    <Skeleton className="e-h-4 e-w-1/2" />
                                </BaseTable.HeaderCell>
                            ))}
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body>
                        {Array.from({ length: rows }).map((_, i) => (
                            <BaseTable.Row key={i}>
                                {Array.from({ length: cols }).map((_, j) => (
                                    <BaseTable.Cell key={j}>
                                        <Skeleton className="e-h-4 e-w-1/3" />
                                    </BaseTable.Cell>
                                ))}
                            </BaseTable.Row>
                        ))}
                    </BaseTable.Body>
                </table>
            </div>
        </Card>
    );
}

function ImageSliderCardSkeleton() {
    return (
        <div className="e-h-[200px] e-w-[250px] e-min-w-[250px]">
            <Skeleton className="e-mb-3 e-h-[120px] e-w-full" />
            <Skeleton className="e-mb-1 e-h-4 e-w-4/5" />
            <Skeleton className="e-mb-1 e-h-3 e-w-full" />
            <Skeleton className="e-h-3 e-w-3/4" />
        </div>
    );
}

export function ImageSliderSkeleton() {
    return (
        <Card ui="dashkit">
            <CardBody ui="dashkit">
                <div className="e-mb-3 e-flex e-justify-between e-border-b e-border-gray-300 e-pb-2">
                    <Skeleton className="e-h-5 e-w-80" />
                    <Skeleton className="e-h-4 e-w-40" />
                </div>
                <div className="e-flex e-gap-4 e-overflow-auto e-pb-3">
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                </div>
            </CardBody>
        </Card>
    );
}
