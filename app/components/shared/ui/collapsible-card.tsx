import { cn } from '@shared/utils';
import React from 'react';
import { ChevronDown } from 'react-feather';

type CollapsibleCardProps = {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
    headerButtons?: React.ReactNode;
    collapsible?: boolean;
};

export const CollapsibleCard = React.forwardRef<HTMLDivElement, CollapsibleCardProps>(
    ({ title, children, defaultExpanded = true, className, headerButtons, collapsible = true }, ref) => {
        const [expanded, setExpanded] = React.useState(defaultExpanded);

        return (
            <div ref={ref} className={cn('card', className)}>
                <div className={cn('card-header', collapsible && !expanded && 'border-0')}>
                    <h3 className="card-header-title d-flex align-items-center">{title}</h3>
                    {headerButtons}
                    {collapsible && (
                        <button
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                            className="btn btn-sm btn-white d-flex align-items-center justify-content-center e-py-[5.3px] e-transition-colors"
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
                </div>
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
            </div>
        );
    },
);
CollapsibleCard.displayName = 'CollapsibleCard';
