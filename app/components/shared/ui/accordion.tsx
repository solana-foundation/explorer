import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as React from 'react';
import { ChevronRight as ChevronRightIcon } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
    return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            data-value={props.value}
            className={cn(
                'e-border-b e-border-l-0 e-border-r-0 e-border-t-0 e-border-solid e-border-[#282d2b] e-px-4 last:e-border-b-0',
                className
            )}
            {...props}
        />
    );
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
    return (
        <AccordionPrimitive.Header className="mb-0 e-flex">
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className={cn(
                    'bg-transparent border-0 e-flex e-flex-1 e-items-start e-gap-4 e-rounded-md e-py-4 e-text-left e-text-sm e-font-medium e-outline-none e-transition-all hover:e-underline focus-visible:e-border-neutral-950 focus-visible:e-ring-[3px] focus-visible:e-ring-neutral-950/50 disabled:e-pointer-events-none disabled:e-opacity-50 dark:focus-visible:e-border-neutral-300 dark:focus-visible:e-ring-neutral-300/50 [&[data-state=open]>svg]:e-rotate-90',
                    className
                )}
                {...props}
            >
                <ChevronRightIcon className="e-pointer-events-none e-size-4 e-shrink-0 e-translate-y-0.5 e-text-neutral-500 e-transition-transform e-duration-200 dark:e-text-neutral-400" />
                {children}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            className="[data-state=closed]:e-animate-accordion-up [data-state=open]:e-animate-accordion-down e-overflow-hidden e-text-sm"
            {...props}
        >
            <div className={cn('e-pb-4 e-pt-0', className)}>{children}</div>
        </AccordionPrimitive.Content>
    );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
