import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';

import { HighlightNode } from './HighlightNode';

export function BaseIdlDoc({ docs }: { docs?: string[] }) {
    if (!docs?.length) return null;

    return (
        <div className="mb-0 whitespace-break-spaces font-mono text-xs text-neutral-500">
            <HighlightNode className="rounded">{docs.join(' ')}</HighlightNode>
        </div>
    );
}

export function IdlDocTooltip({ docs, children }: { docs?: string[]; children: React.ReactNode }) {
    if (!docs?.length) return <>{children}</>;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent>
                <div className="min-w-16 max-w-32">{docs.join(' ')}</div>
            </TooltipContent>
        </Tooltip>
    );
}
