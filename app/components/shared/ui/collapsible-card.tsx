import { cn } from '@shared/utils';
import { forwardRef, ReactNode, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

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
            <Card ref={ref} ui="dashkit" className={className}>
                <CardHeader ui="dashkit" className={cn('e-gap-1.5', collapsible && !expanded && 'e-border-0')}>
                    <CardTitle as="h3" ui="dashkit" className="e-flex e-min-w-0 e-items-center">
                        {title}
                    </CardTitle>
                    {headerButtons}
                    {collapsible && (
                        <button
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                            className="btn btn-sm btn-white e-flex e-items-center e-justify-center e-py-[5.3px] e-transition-colors"
                            onClick={() => setExpanded(current => !current)}
                        >
                            <ChevronDown
                                size={16}
                                className={cn(
                                    'e-transition-transform e-duration-200 e-ease-in-out',
                                    expanded && 'e-rotate-180',
                                )}
                            />
                        </button>
                    )}
                </CardHeader>
                {collapsible ? (
                    <div
                        className={cn(
                            'e-grid e-transition-[grid-template-rows] e-duration-200 e-ease-in-out',
                            expanded ? 'e-grid-rows-[1fr]' : 'e-grid-rows-[0fr]',
                        )}
                    >
                        <div className="e-overflow-hidden">{children}</div>
                    </div>
                ) : (
                    children
                )}
            </Card>
        );
    },
);
CollapsibleCard.displayName = 'CollapsibleCard';
