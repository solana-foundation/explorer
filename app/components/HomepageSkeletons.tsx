import { TableRowSkeleton } from '@components/common/Skeletons';
import { Skeleton } from '@components/shared/ui/skeleton';

export function LiveTransactionStatsBodySkeleton() {
    return (
        <div className="e-flex e-flex-1 e-flex-col">
            <div className="table-responsive e-mb-0">
                <table className="table table-sm card-table table-nowrap">
                    <tbody className="list">
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                    </tbody>
                </table>
            </div>

            <hr className="e-my-0" />

            <div className="card-body e-flex e-flex-1 e-flex-col e-py-3">
                <div className="e-mb-3 e-flex e-w-full e-justify-between">
                    <Skeleton className="e-h-4 e-w-24" />
                    <div className="e-flex e-gap-2">
                        <Skeleton className="e-h-6 e-w-12" />
                        <Skeleton className="e-h-6 e-w-12" />
                        <Skeleton className="e-h-6 e-w-12" />
                    </div>
                </div>

                {/* matches the chart container: mt-3 + minHeight 200px */}
                <Skeleton className="e-mt-3 e-min-h-[200px] e-flex-1" />
            </div>
        </div>
    );
}

export function LiveTransactionStatsCardSkeleton() {
    return (
        <div className="card e-flex e-flex-1 e-flex-col">
            <div className="card-header">
                <Skeleton className="e-h-5 e-w-48" />
            </div>
            <LiveTransactionStatsBodySkeleton />
        </div>
    );
}
