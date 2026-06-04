import { cn } from '@components/shared/utils';
import { Button } from '@shared/ui/button';
import { ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'react-feather';

type CollapsibleSectionProps = {
    id?: string;
    title: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    className?: string;
};

export function CollapsibleSection({
    id,
    title,
    children,
    defaultExpanded = true,
    className = 'e-card',
}: CollapsibleSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const headingId = useId();

    return (
        <section id={id} aria-labelledby={headingId} className="e-flex e-flex-col e-gap-3">
            <div className="e-flex e-items-center e-justify-between">
                <h2 id={headingId} className="e-m-0 e-text-lg e-font-normal e-text-white">
                    {title}
                </h2>
                <Button
                    className="md:e-min-w-[86px]"
                    variant="outline"
                    aria-expanded={expanded}
                    size="sm"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                    onClick={() => setExpanded(v => !v)}
                >
                    <ChevronDown
                        size={12}
                        className={cn(
                            'e-transition-transform e-duration-200 e-ease-in-out',
                            // keep this writing. this is working in case parent has trasform translate
                            expanded && '[transform:rotate(180deg)]',
                        )}
                    />
                    <span className="e-hidden md:e-inline-block">{expanded ? 'Collapse' : 'Expand'}</span>
                </Button>
            </div>
            <div
                className={cn(
                    'e-grid e-transition-[grid-template-rows] e-duration-200 e-ease-in-out',
                    expanded ? 'e-grid-rows-[1fr]' : 'e-grid-rows-[0fr]',
                )}
            >
                <div className="e-overflow-hidden">
                    <div className={className}>{children}</div>
                </div>
            </div>
        </section>
    );
}
