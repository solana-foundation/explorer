// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { ReactElement } from 'react';

import { Card, CardBody, CardHeader } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { Skeleton } from './ui/skeleton';

type ColDef = {
    skeleton: string;
    td?: string;
};

export function TableRowSkeleton({
    cols = [{ skeleton: 'h-4 w-36', td: 'w-full' }, { skeleton: 'h-4 w-20' }],
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
                <Skeleton className="mb-2 h-3 w-3/5" />
                <Skeleton className="mb-2 h-3 w-full" />
                <Skeleton className="h-3 w-2/5" />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function SimpleCardSkeleton({ withTitle = false, title }: { withTitle?: boolean; title?: ReactElement }) {
    return (
        <Card ui="dashkit" className="mb-3 w-full md:mb-6">
            {withTitle && (
                <CardHeader ui="dashkit">
                    {/* Wrapper absorbs CardHeader's [&>:first-child]:flex-1 so Skeleton's w-40 isn't stretched to full width. */}
                    <div>
                        <Skeleton className="h-5 w-40" />
                    </div>
                </CardHeader>
            )}
            <CardBody ui="dashkit">
                {title || <Skeleton className="h-5 w-3/5" />}
                <Skeleton className="mb-2.5 mt-2 h-7 w-full" />
                <Skeleton className="h-3 w-2/5" />
            </CardBody>
        </Card>
    );
}

export function RichListSkeleton({ rows = 2 }: { rows?: number }) {
    return (
        <Card ui="dashkit" flex="grow">
            <CardHeader ui="dashkit">
                {/* Wrapper absorbs CardHeader's [&>:first-child]:flex-1 so Skeleton's w-40 isn't stretched to full width. */}
                <div>
                    <Skeleton className="h-5 w-40" />
                </div>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body>
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
                {/* Wrapper absorbs CardHeader's [&>:first-child]:flex-1 so Skeleton's w-40 isn't stretched to full width. */}
                <div>
                    <Skeleton className="h-5 w-40" />
                </div>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body>
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
                <Skeleton className="h-5 w-64" />
            </CardHeader>
            <BaseTable ui="dashkit">
                <BaseTable.Head>
                    <BaseTable.Row>
                        {Array.from({ length: cols }).map((_, i) => (
                            <BaseTable.HeaderCell key={i}>
                                <Skeleton className="h-4 w-1/2" />
                            </BaseTable.HeaderCell>
                        ))}
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {Array.from({ length: rows }).map((_, i) => (
                        <BaseTable.Row key={i}>
                            {Array.from({ length: cols }).map((_, j) => (
                                <BaseTable.Cell key={j}>
                                    <Skeleton className="h-4 w-1/3" />
                                </BaseTable.Cell>
                            ))}
                        </BaseTable.Row>
                    ))}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}

function ImageSliderCardSkeleton() {
    return (
        <div className="h-[200px] w-[250px] min-w-[250px]">
            <Skeleton className="mb-3 h-[120px] w-full" />
            <Skeleton className="mb-1 h-4 w-4/5" />
            <Skeleton className="mb-1 h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
        </div>
    );
}

export function ImageSliderSkeleton() {
    return (
        <Card ui="dashkit">
            <CardBody ui="dashkit">
                <div className="mb-3 flex justify-between border-b border-gray-300 pb-2">
                    <Skeleton className="h-5 w-80" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex gap-4 overflow-auto pb-3">
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                </div>
            </CardBody>
        </Card>
    );
}
