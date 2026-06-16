import { cn } from '@shared/utils';
import { forwardRef, ReactNode, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { BaseCard, BaseCardHeader, BaseCardTitle } from '@/app/shared/ui/Card';

type CollapsibleCardProps = {
    title: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    className?: string;
    headerButtons?: ReactNode;
    collapsible?: boolean;
};

export const CollapsibleCard = forwardRef<HTMLDivElement, CollapsibleCardProps>(
    ({ title, children, defaultExpanded = true, className, headerButtons, collapsible = true }, ref) => {
        const [expanded, setExpanded] = useState(defaultExpanded);

        return (
            <BaseCard
                ref={ref}
                ui="dashkit"
                className={className}
                style={{ scrollMarginTop: 'var(--sticky-header-height, 0px)' }}
            >
                <BaseCardHeader
                    ui="dashkit"
                    className={cn('h-auto min-h-[60px] gap-2', collapsible && !expanded && 'border-b-0')}
                >
                    <BaseCardTitle ui="dashkit" className="flex min-w-0 items-center break-all">
                        {title}
                    </BaseCardTitle>
                    {headerButtons}
                    {collapsible && (
                        <Button
                            ui="dashkit"
                            variant="white"
                            size="sm"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                            className="flex items-center justify-center py-[5.3px] transition-colors"
                            onClick={() => setExpanded(current => !current)}
                        >
                            <ChevronDown
                                size={16}
                                className={cn(
                                    'transition-transform duration-200 ease-in-out',
                                    // keep this writing. this is working in case parent has trasform translate
                                    expanded && '[transform:rotate(180deg)]',
                                )}
                            />
                        </Button>
                    )}
                </BaseCardHeader>
                {collapsible ? (
                    <div
                        className={cn(
                            'grid transition-[grid-template-rows] duration-200 ease-in-out',
                            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                    >
                        <div className="overflow-hidden">{children}</div>
                    </div>
                ) : (
                    children
                )}
            </BaseCard>
        );
    },
);
CollapsibleCard.displayName = 'CollapsibleCard';
