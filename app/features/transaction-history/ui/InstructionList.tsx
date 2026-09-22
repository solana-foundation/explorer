import { type InstructionSummary } from '@entities/transaction-data';

import { Skeleton } from '@/app/components/shared/ui/skeleton';

type InstructionListProps = {
    instructions: InstructionSummary[];
};

export function InstructionList({ instructions }: InstructionListProps) {
    return (
        <div className="flex flex-col gap-1">
            {instructions.map((instruction, i) => (
                <InstructionLine key={i} instruction={instruction} />
            ))}
        </div>
    );
}

export function InstructionListSkeleton() {
    return (
        <div className="my-1 flex flex-col gap-1">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3.5 w-36" />
        </div>
    );
}

function InstructionLine({ instruction }: { instruction: InstructionSummary }) {
    // Inline (not flex): program + instruction need to behave as one text run
    // so they wrap together at the cell boundary rather than each becoming a
    // separately-wrapping flex item with weird gaps between them.
    return (
        <span className="cursor-default text-sm">
            <span className="text-muted">{instruction.programName}: </span>
            <span className="text-white">{instruction.name}</span>
        </span>
    );
}
