import { TableRowSkeleton } from '@components/common/Skeletons';
import { Skeleton } from '@components/shared/ui/skeleton';

export function LiveTransactionStatsBodySkeleton() {
    return (
        <div className="d-flex flex-column flex-grow-1">
            <div className="table-responsive mb-0">
                <table className="table table-sm card-table table-nowrap">
                    <tbody className="list">
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                    </tbody>
                </table>
            </div>

            <hr className="my-0" />

            <div className="card-body py-3 d-flex flex-column flex-grow-1">
                <div className="d-flex justify-content-between w-100 mb-3">
                    <Skeleton className="e-h-4 e-w-24" />
                    <div className="d-flex gap-2">
                        <Skeleton className="e-h-6 e-w-12" />
                        <Skeleton className="e-h-6 e-w-12" />
                        <Skeleton className="e-h-6 e-w-12" />
                    </div>
                </div>

                {/* matches the chart container: mt-3 + minHeight 200px */}
                <Skeleton className="mt-3 e-flex-1" style={{ minHeight: '200px' }} />
            </div>
        </div>
    );
}

export function LiveTransactionStatsCardSkeleton() {
    return (
        <div className="card flex-grow-1 d-flex flex-column">
            <div className="card-header">
                <Skeleton className="e-h-5 e-w-48" />
            </div>
            <LiveTransactionStatsBodySkeleton />
        </div>
    );
}
