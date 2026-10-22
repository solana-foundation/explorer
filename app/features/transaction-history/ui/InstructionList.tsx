import { type InstructionSummary } from '@entities/transaction-data';

import { Skeleton } from '@/app/components/shared/ui/skeleton';

import { summarizeInstructions } from '../lib/summarize-instructions';

type InstructionListProps = {
    instructions: InstructionSummary[];
};

export function InstructionList({ instructions }: InstructionListProps) {
    const summarized = summarizeInstructions(instructions);
    return (
        <div className="flex flex-col gap-1">
            {summarized.map(({ instruction, count }, i) => (
                <InstructionLine key={i} instruction={instruction} count={count} />
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

function InstructionLine({ instruction, count }: { instruction: InstructionSummary; count: number }) {
    return (
        <span className="cursor-default text-sm">
            {count > 1 && <span className="mr-1.5 tabular-nums text-outer-space-300">{count} ×</span>}
            <span className="text-muted">{instruction.programName}: </span>
            <span className="text-white">{instruction.name}</span>
        </span>
    );
}
