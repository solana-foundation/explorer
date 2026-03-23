import {
    RichListSkeleton,
    SimpleCardSkeleton,
    StatsTableSkeleton,
    TableCardSkeleton,
} from '@components/common/Skeletons';
import { Skeleton } from '@components/shared/ui/skeleton';

function InstructionsSectionSkeleton() {
    return (
        <>
            <div className="container">
                <div className="header">
                    <div className="header-body">
                        <Skeleton className="e-h-8 e-w-28" />
                    </div>
                </div>
            </div>
            <SimpleCardSkeleton />
            <SimpleCardSkeleton />
        </>
    );
}

export function TransactionDetailsSkeleton() {
    return (
        <>
            <TableCardSkeleton cols={5} rows={4} />
            <TableCardSkeleton rows={4} />
            <InstructionsSectionSkeleton />
            <RichListSkeleton />
            <SimpleCardSkeleton withTitle />
        </>
    );
}

export function TransactionPageSkeleton() {
    return (
        <>
            <StatsTableSkeleton rows={12} />
            <TransactionDetailsSkeleton />
        </>
    );
}
