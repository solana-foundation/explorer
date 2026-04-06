import { cn } from '@shared/utils';
import React from 'react';

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
            <div ref={ref} className={className ?? 'card'}>
                <div className={cn('card-header', collapsible && !expanded && 'border-0')}>
                    <h3 className="card-header-title d-flex align-items-center">{title}</h3>
                    {headerButtons}
                    {collapsible && (
                        <button
                            className={cn('btn btn-sm d-flex', expanded ? 'btn-black active' : 'btn-white')}
                            onClick={() => setExpanded(current => !current)}
                        >
                            {expanded ? 'Collapse' : 'Expand'}
                        </button>
                    )}
                </div>
                {(!collapsible || expanded) && children}
            </div>
        );
    },
);
CollapsibleCard.displayName = 'CollapsibleCard';
