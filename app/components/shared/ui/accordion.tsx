// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
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
                'border-b border-l-0 border-r-0 border-t-0 border-solid border-neutral-700 px-4 [outline:none] last:border-b-0',
                className,
            )}
            {...props}
        />
    );
}

const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
    return (
        <AccordionPrimitive.Header className="mb-0 flex">
            <AccordionPrimitive.Trigger
                ref={ref}
                data-slot="accordion-trigger"
                className={cn(
                    'flex flex-1 items-start gap-4 rounded-md border-0 bg-transparent py-4',
                    'appearance-none text-left text-sm font-medium text-neutral-200 [outline:none]',
                    'hover:underline',
                    'focus-visible:ring-1 focus-visible:ring-neutral-600 focus-visible:ring-offset-0',
                    'disabled:pointer-events-none disabled:opacity-50',
                    '[&[data-state=open]>svg]:rotate-90',
                    className,
                )}
                {...props}
            >
                <ChevronRightIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-neutral-500 transition-transform duration-200" />
                {children}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
});
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
    return (
        <AccordionPrimitive.Content
            ref={ref}
            data-slot="accordion-content"
            className="[data-state=closed]:animate-accordion-up [data-state=open]:animate-accordion-down overflow-hidden text-sm [outline:none]"
            {...props}
        >
            <div className={cn('pb-4 pt-0', className)}>{children}</div>
        </AccordionPrimitive.Content>
    );
});
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
