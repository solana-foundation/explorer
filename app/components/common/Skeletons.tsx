import { Skeleton } from '@components/shared/ui/skeleton';

type ColDef = {
    skeleton: string;
    td?: string;
};

export function TableRowSkeleton({
    cols = [{ skeleton: 'e-h-4 e-w-36', td: 'w-100' }, { skeleton: 'e-h-4 e-w-20' }],
}: {
    cols?: ColDef[];
}) {
    return (
        <tr>
            {cols.map(({ skeleton, td }, i) => (
                <td key={i} className={td}>
                    <Skeleton className={skeleton} />
                </td>
            ))}
        </tr>
    );
}

export function RichRowSkeleton() {
    return (
        <tr>
            <td>
                <Skeleton className="mb-2 e-h-3 e-w-3/5" />
                <Skeleton className="mb-2 e-h-3 e-w-full" />
                <Skeleton className="e-h-3 e-w-2/5" />
            </td>
        </tr>
    );
}

export function SimpleCardSkeleton({ withTitle = false }: { withTitle?: boolean }) {
    return (
        <div className="card">
            {withTitle && (
                <div className="card-header">
                    <div className="row align-items-center">
                        <div className="col">
                            <Skeleton className="e-h-5 e-w-40" />
                        </div>
                    </div>
                </div>
            )}
            <div className="card-body">
                <Skeleton className="mb-2 e-h-7 e-w-3/5" />
                <Skeleton className="mb-2 e-h-12 e-w-full" />
                <Skeleton className="e-h-6 e-w-2/5" />
            </div>
        </div>
    );
}

export function RichListSkeleton({ rows = 2 }: { rows?: number }) {
    return (
        <div className="card flex-grow-1">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <Skeleton className="e-h-5 e-w-40" />
                    </div>
                </div>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm card-table table-nowrap">
                    <tbody className="list">
                        {Array.from({ length: rows }).map((_, i) => (
                            <RichRowSkeleton key={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function StatsTableSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div className="card flex-grow-1">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <Skeleton className="e-h-5 e-w-40" />
                    </div>
                </div>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm card-table table-nowrap">
                    <tbody className="list">
                        {Array.from({ length: rows }).map((_, i) => (
                            <TableRowSkeleton key={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function TableCardSkeleton({ cols = 4, rows = 6 }: { cols?: number; rows?: number }) {
    return (
        <div className="card">
            <div className="card-header">
                <Skeleton className="e-h-5 e-w-64" />
            </div>
            <div className="table-responsive small-headers">
                <table className="table">
                    <thead>
                        <tr>
                            {Array.from({ length: cols }).map((_, i) => (
                                <th key={i}>
                                    <Skeleton className="e-h-4 e-w-1/2" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i}>
                                {Array.from({ length: cols }).map((_, j) => (
                                    <td key={j}>
                                        <Skeleton className="e-h-4 e-w-1/3" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ImageSliderCardSkeleton() {
    return (
        <div style={{ height: '200px', minWidth: '250px', width: '250px' }}>
            <Skeleton className="mb-3 e-w-full" style={{ height: '120px' }} />
            <Skeleton className="mb-1 e-h-4 e-w-4/5" />
            <Skeleton className="mb-1 e-h-3 e-w-full" />
            <Skeleton className="e-h-3 e-w-3/4" />
        </div>
    );
}

export function ImageSliderSkeleton() {
    return (
        <div className="card">
            <div className="card-body">
                <div className="d-flex justify-content-between border-bottom border-gray-300 pb-2 mb-3">
                    <Skeleton className="e-h-5 e-w-80" />
                    <Skeleton className="e-h-4 e-w-40" />
                </div>
                <div className="d-flex gap-4 pb-3 overflow-auto">
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                    <ImageSliderCardSkeleton />
                </div>
            </div>
        </div>
    );
}
