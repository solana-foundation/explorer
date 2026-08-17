import { type InstructionSummary } from '@entities/transaction-data';
import { type ReactNode } from 'react';

import { Skeleton } from '@/app/components/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

const INLINE_LIMIT = 3;

type InstructionListProps = {
    instructions: InstructionSummary[];
    /** Optional element appended inline at the end of the first program row. */
    trailingAction?: ReactNode;
};

export function InstructionList({ instructions, trailingAction }: InstructionListProps) {
    const visible = instructions.slice(0, INLINE_LIMIT);
    const overflow = instructions.slice(INLINE_LIMIT);

    return (
        <div className="flex flex-col gap-1">
            {visible.map((instruction, i) => (
                <InstructionLine key={i} instruction={instruction} trailing={i === 0 ? trailingAction : undefined} />
            ))}
            {overflow.length > 0 && <OverflowLine instructions={overflow} />}
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

function InstructionLine({ instruction, trailing }: { instruction: InstructionSummary; trailing?: ReactNode }) {
    // Inline (not flex): program + instruction need to behave as one text run
    // so they wrap together at the cell boundary rather than each becoming a
    // separately-wrapping flex item with weird gaps between them.
    return (
        <span className="block cursor-default text-sm">
            <span className="text-outer-space-300">{instruction.program}</span>{' '}
            <span className="text-white">{instruction.name}</span>
            {trailing}
        </span>
    );
}

function OverflowLine({ instructions }: { instructions: InstructionSummary[] }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="cursor-pointer text-sm text-outer-space-300">+{instructions.length} more</span>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                sideOffset={4}
                className="flex min-w-64 flex-col gap-1.5 rounded-lg border border-solid border-outer-space-800 bg-outer-space-900 p-3 shadow-md"
            >
                <span className="text-sm font-medium text-white">Programs</span>
                {instructions.map((instruction, i) => (
                    <InstructionLine key={i} instruction={instruction} />
                ))}
            </TooltipContent>
        </Tooltip>
    );
}
