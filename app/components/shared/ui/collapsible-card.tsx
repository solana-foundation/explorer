import { cn } from '@shared/utils';
import { forwardRef, ReactNode, useState } from 'react';
import { ChevronDown } from 'react-feather';

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
            <div ref={ref} className={cn('card', className)}>
                <div
                    className={cn(
                        'card-header e-h-auto e-min-h-[60px] e-gap-2',
                        collapsible && !expanded && 'border-0',
                    )}
                >
                    <h3 className="card-header-title e-flex e-items-center e-break-all">{title}</h3>
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
                                    // keep this writing. this is working in case parent has trasform translate
                                    expanded && '[transform:rotate(180deg)]',
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
