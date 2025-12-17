import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';

import { HighlightNode } from './HighlightNode';

export function BaseIdlDoc({ docs }: { docs?: string[] }) {
    if (!docs?.length) return null;

    return (
        <div className="e-mb-0 e-whitespace-break-spaces e-font-mono e-text-xs e-text-neutral-500">
            <HighlightNode className="e-rounded">{docs.join(' ')}</HighlightNode>
        </div>
    );
}

export function IdlDocTooltip({ docs, children }: { docs?: string[]; children: React.ReactNode }) {
    if (!docs?.length) return <>{children}</>;

    return (
        <Tooltip>
            <TooltipTrigger className="e-border-0 e-bg-transparent e-text-inherit" asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent>
                <div className="e-min-w-16 e-max-w-32">{docs.join(' ')}</div>
            </TooltipContent>
        </Tooltip>
    );
}
