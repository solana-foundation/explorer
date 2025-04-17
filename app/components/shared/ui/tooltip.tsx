import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return (
        <TooltipProvider>
            <TooltipPrimitive.Root data-slot="tooltip" {...props} />
        </TooltipProvider>
    );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 0,
    children,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    'e-animate-in e-fade-in-0 e-zoom-in-95 data-[state=closed]:e-animate-out data-[state=closed]:e-fade-out-0 data-[state=closed]:e-zoom-out-95 data-[side=bottom]:e-slide-in-from-top-2 data-[side=left]:e-slide-in-from-right-2 data-[side=right]:e-slide-in-from-left-2 data-[side=top]:e-slide-in-from-bottom-2 e-origin-(--radix-tooltip-content-transform-origin) e-z-50 e-w-fit e-text-balance e-rounded-md e-bg-neutral-900 e-px-3 e-py-1.5 e-text-xs e-text-neutral-50 dark:e-bg-neutral-50 dark:e-text-neutral-900',
                    className
                )}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow className="e-fill-primary e-z-50 e-size-2.5 e-translate-y-[calc(-50%_-_2px)] e-rotate-0 e-rounded-[2px] e-fill-transparent dark:e-fill-neutral-50" />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
