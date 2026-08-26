import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { baseCardVariants } from '@/app/shared/ui/Card';

type CollapsibleSectionProps = {
    id?: string;
    title: ReactNode;
    actions?: ReactNode;
    /** Full-width content stacked under the title row, inside the same (always-visible) title group. */
    belowTitle?: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    /** When false, the collapse toggle is hidden and the body is always shown. Defaults to true. */
    collapsible?: boolean;
    className?: string;
    titleClassName?: string;
    sectionClassName?: string;
};

export function CollapsibleSection({
    id,
    title,
    actions,
    belowTitle,
    children,
    defaultExpanded = true,
    collapsible = true,
    className = baseCardVariants({ ui: 'dashkit' }),
    titleClassName,
    sectionClassName,
}: CollapsibleSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const headingId = useId();

    // When not collapsible, the body is always shown regardless of the (unused) toggle state.
    const isOpen = !collapsible || expanded;

    return (
        <section id={id} aria-labelledby={headingId} className={cn('flex flex-col gap-3', sectionClassName)}>
            {/* Title (plus optional `belowTitle`) forms the first column; actions and the collapse toggle
                form a second. Without `belowTitle` the title stays a direct child, untouched. */}
            <div data-section-title className={cn('flex items-center justify-between', titleClassName)}>
                {belowTitle ? (
                    <div className="flex min-w-0 flex-col gap-2">
                        <h2 id={headingId} className="m-0 text-lg font-normal text-white">
                            {title}
                        </h2>
                        {belowTitle}
                    </div>
                ) : (
                    <h2 id={headingId} className="m-0 text-lg font-normal text-white">
                        {title}
                    </h2>
                )}
                {(collapsible || actions) && (
                    <div className="flex shrink-0 items-center gap-1">
                        {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
                        {collapsible && (
                            <Button
                                className="md:min-w-[86px]"
                                variant="outline"
                                aria-expanded={expanded}
                                size="sm"
                                aria-label={expanded ? 'Collapse' : 'Expand'}
                                onClick={() => setExpanded(v => !v)}
                            >
                                <ChevronDown
                                    size={12}
                                    className={cn(
                                        'transition-transform duration-200 ease-in-out',
                                        // Rotate via an explicit `transform` rather than the `rotate-*` utility so an
                                        // ancestor's `translate` transform can't override the flip.
                                        expanded && '[transform:rotate(180deg)]',
                                    )}
                                />
                                <span className="hidden md:inline-block">{expanded ? 'Collapse' : 'Expand'}</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <div
                className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-in-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className="overflow-hidden">
                    <div className={className}>{children}</div>
                </div>
            </div>
        </section>
    );
}
