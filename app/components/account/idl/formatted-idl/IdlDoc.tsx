'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

export function IdlDoc({ docs }: { docs: string[] }) {
    if (!docs?.length) return null;

    return <p className="text-muted mb-0">{docs.join(' ')}</p>;
}

// TODO: improve Tooltip. Vurrent version renders additional button element inside another one
export function IdlDocTooltip({ docs, children }: { docs?: string[]; children: React.ReactNode }) {
    if (!docs?.length) return <>{children}</>;

    return (
        <Tooltip>
            <TooltipTrigger className="e-border-0 e-bg-transparent e-p-0 e-text-inherit">{children}</TooltipTrigger>
            <TooltipContent>
                <div className="e-min-w-36 e-max-w-16">{docs.join(' ')}</div>
            </TooltipContent>
        </Tooltip>
    );
}
