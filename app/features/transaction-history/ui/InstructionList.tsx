import { Skeleton } from '@/app/components/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';
import { TransactionInstructionInfo } from '@/app/utils/instruction';

const INLINE_LIMIT = 3;

export function InstructionList({ instructions }: { instructions: TransactionInstructionInfo[] }) {
    const visible = instructions.slice(0, INLINE_LIMIT);
    const overflow = instructions.slice(INLINE_LIMIT);

    return (
        <div className="mt-1 flex flex-col">
            {visible.map((instruction, i) => (
                <InstructionLine key={i} instruction={instruction} />
            ))}
            {overflow.length > 0 && <OverflowLine instructions={overflow} />}
        </div>
    );
}

function InstructionLine({ instruction }: { instruction: TransactionInstructionInfo }) {
    return (
        <span className="cursor-default text-xs">
            <span className="text-muted">{instruction.program}: </span>
            <span className="text-white">{instruction.name}</span>
        </span>
    );
}

export function InstructionListSkeleton() {
    return (
        <div className="mt-1 flex flex-col gap-1">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3.5 w-36" />
        </div>
    );
}

function OverflowLine({ instructions }: { instructions: TransactionInstructionInfo[] }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="cursor-pointer text-xs text-muted">+{instructions.length} more</span>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                sideOffset={4}
                className="flex min-w-64 flex-col gap-1.5 rounded-lg border border-solid border-outer-space-800 bg-outer-space-900 p-3 shadow-md"
            >
                <span className="text-xs font-medium text-white">Programs</span>
                {instructions.map((instruction, i) => (
                    <InstructionLine key={i} instruction={instruction} />
                ))}
            </TooltipContent>
        </Tooltip>
    );
}
