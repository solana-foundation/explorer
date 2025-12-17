import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '@shared/utils';
import * as React from 'react';
import { ChevronDown } from 'react-feather';

const Accordion = AccordionPrimitive.Root;
const AccordionItem = AccordionPrimitive.Item;

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
    const [isOpen, setIsOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const observer = new MutationObserver(() => {
            setIsOpen(trigger.getAttribute('data-state') === 'open');
        });

        observer.observe(trigger, {
            attributeFilter: ['data-state'],
            attributes: true,
        });

        setIsOpen(trigger.getAttribute('data-state') === 'open');

        return () => observer.disconnect();
    }, []);

    return (
        <AccordionPrimitive.Header className="e-mb-0">
            <AccordionPrimitive.Trigger
                ref={triggerRef}
                data-slot="accordion-trigger"
                className={cn(
                    'e-flex e-items-center e-justify-between',
                    'e-w-full',
                    'e-m-0',
                    'border-0 e-appearance-none e-bg-transparent e-shadow-none ',
                    ' e-px-6 e-py-4',
                    className
                )}
                {...props}
            >
                {children}
                <span className="e-flex e-items-center e-gap-2 e-text-xs e-text-emerald-600">
                    {isOpen ? 'Collapse' : 'Expand'}
                    <ChevronDown
                        className={cn('e-size-4 e-shrink-0 e-transition-transform', isOpen ? 'e-rotate-180' : '')}
                    />
                </span>
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

const AccordionContent = AccordionPrimitive.Content;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
