import { Skeleton } from '@/app/components/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';
import { TransactionInstructionInfo } from '@/app/utils/instruction';

const INLINE_LIMIT = 3;

export function InstructionList({ instructions }: { instructions: TransactionInstructionInfo[] }) {
    const visible = instructions.slice(0, INLINE_LIMIT);
    const overflow = instructions.slice(INLINE_LIMIT);

    return (
        <div className="e-mt-1 e-flex e-flex-col">
            {visible.map((instruction, i) => (
                <InstructionLine key={i} instruction={instruction} />
            ))}
            {overflow.length > 0 && <OverflowLine instructions={overflow} />}
        </div>
    );
}

function InstructionLine({ instruction }: { instruction: TransactionInstructionInfo }) {
    return (
        <span className="e-cursor-default e-text-xs">
            <span className="e-text-muted">{instruction.program}: </span>
            <span className="e-text-white">{instruction.name}</span>
        </span>
    );
}

const SKELETON_WIDTHS = ['e-w-44', 'e-w-36', 'e-w-40'] as const;

export function InstructionListSkeleton({ count }: { count?: number }) {
    const visibleCount = Math.min(count ?? 0, INLINE_LIMIT);
    return (
        <div className="e-mt-1 e-flex e-flex-col e-gap-1">
            {Array.from({ length: visibleCount }, (_, i) => (
                <Skeleton key={i} className={`e-h-3.5 ${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}`} />
            ))}
            {count && count > INLINE_LIMIT && (
                <span className="e-cursor-default e-text-xs e-text-muted">+{count - INLINE_LIMIT} more</span>
            )}
        </div>
    );
}

function OverflowLine({ instructions }: { instructions: TransactionInstructionInfo[] }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="e-cursor-pointer e-text-xs e-text-muted">+{instructions.length} more</span>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                sideOffset={4}
                className="e-flex e-min-w-64 e-flex-col e-gap-1.5 e-rounded-lg e-border e-border-solid e-border-outer-space-800 e-bg-outer-space-900 e-p-3 e-shadow-md"
            >
                <span className="e-text-xs e-font-medium e-text-white">Programs</span>
                {instructions.map((instruction, i) => (
                    <InstructionLine key={i} instruction={instruction} />
                ))}
            </TooltipContent>
        </Tooltip>
    );
}
