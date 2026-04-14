import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

const INLINE_LIMIT = 3;

export function InstructionBadges({ names }: { names: string[] }) {
    const visible = names.slice(0, INLINE_LIMIT);
    const overflow = names.slice(INLINE_LIMIT);

    return (
        <div className="e-mt-1 e-flex e-flex-wrap e-gap-1">
            {visible.map((name, i) => (
                <span key={`${name}-${i}`} className="badge bg-secondary-soft e-cursor-default">
                    {name}
                </span>
            ))}
            {overflow.length > 0 && <OverflowBadge names={overflow} />}
        </div>
    );
}

function OverflowBadge({ names }: { names: string[] }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="badge bg-secondary-soft e-cursor-pointer">+{names.length} more</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="e-flex e-flex-col e-gap-1 e-p-2 e-text-inherit">
                {names.map((name, i) => (
                    <span key={`${name}-${i}`} className="badge bg-secondary-soft e-w-fit e-cursor-default">
                        {name}
                    </span>
                ))}
            </TooltipContent>
        </Tooltip>
    );
}
