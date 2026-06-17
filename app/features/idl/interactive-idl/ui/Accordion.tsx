import { cn } from '@components/shared/utils';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
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
        <AccordionPrimitive.Header className="mb-0">
            <AccordionPrimitive.Trigger
                ref={triggerRef}
                data-slot="accordion-trigger"
                className={cn(
                    'flex items-center justify-between',
                    'w-full',
                    'm-0',
                    'appearance-none border-0 bg-transparent shadow-none',
                    'px-6 py-4',
                    className,
                )}
                {...props}
            >
                {children}
                <span className="flex items-center gap-2 text-xs text-emerald-600">
                    {isOpen ? 'Collapse' : 'Expand'}
                    <ChevronDown className={cn('size-4 shrink-0 transition-transform', isOpen ? 'rotate-180' : '')} />
                </span>
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

const AccordionContent = AccordionPrimitive.Content;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
