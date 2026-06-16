import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { baseCardVariants } from '@/app/shared/ui/Card';

type CollapsibleSectionProps = {
    id?: string;
    title: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    className?: string;
    titleClassName?: string;
};

export function CollapsibleSection({
    id,
    title,
    actions,
    children,
    defaultExpanded = true,
    className = baseCardVariants({ ui: 'dashkit' }),
    titleClassName,
}: CollapsibleSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const headingId = useId();

    return (
        <section id={id} aria-labelledby={headingId} className="flex flex-col gap-3">
            <div className={cn('flex items-center justify-between', titleClassName)}>
                <h2 id={headingId} className="m-0 text-lg font-normal text-white">
                    {title}
                </h2>
                <div className="flex items-center gap-1">
                    {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
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
                                // keep this writing. this is working in case parent has trasform translate
                                expanded && '[transform:rotate(180deg)]',
                            )}
                        />
                        <span className="hidden md:inline-block">{expanded ? 'Collapse' : 'Expand'}</span>
                    </Button>
                </div>
            </div>
            <div
                className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-in-out',
                    expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className="overflow-hidden">
                    <div className={className}>{children}</div>
                </div>
            </div>
        </section>
    );
}
