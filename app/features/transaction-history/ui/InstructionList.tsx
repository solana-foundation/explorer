import { type InstructionSummary } from '@entities/transaction-data';

import { Skeleton } from '@/app/components/shared/ui/skeleton';

import { summarizeInstructions } from '../lib/summarize-instructions';
import type { RowTransactionState } from '../model/use-row-transaction';
import { RetryButton } from './RetryButton';

export function ProgramsBlock({ state }: { state: RowTransactionState }) {
    switch (state.status) {
        case 'loading':
            return <InstructionListSkeleton />;
        case 'failed':
            return <RetryButton label="Retry loading programs" onRetry={state.retry} />;
        case 'loaded':
            return state.summaries.length > 0 ? (
                <InstructionList instructions={state.summaries} />
            ) : (
                <span className="text-outer-space-300">---</span>
            );
        default:
            return state satisfies never;
    }
}

type InstructionListProps = {
    instructions: readonly InstructionSummary[];
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

function InstructionListSkeleton() {
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
