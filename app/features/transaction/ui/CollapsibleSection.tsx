'use client';

import { cn } from '@components/shared/utils';
import { ReactNode, useState } from 'react';
import { ChevronDown } from 'react-feather';

type CollapsibleSectionProps = {
    id?: string;
    title: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
};

export function CollapsibleSection({ id, title, children, defaultExpanded = true }: CollapsibleSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <section id={id} className="e-flex e-flex-col e-gap-3">
            <div className="e-flex e-items-center e-justify-between">
                <h2 className="e-m-0 e-text-lg e-font-normal e-text-white">{title}</h2>
                <button
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                    className="e-flex e-h-7 e-w-7 e-items-center e-justify-center e-rounded e-border-0 e-bg-transparent e-text-muted e-transition-colors hover:e-bg-neutral-800 hover:e-text-white"
                    onClick={() => setExpanded(v => !v)}
                >
                    <ChevronDown
                        size={16}
                        className={cn(
                            'e-transition-transform e-duration-200 e-ease-in-out',
                            expanded && 'e-rotate-180',
                        )}
                    />
                </button>
            </div>
            <div
                className={cn(
                    'e-grid e-transition-[grid-template-rows] e-duration-200 e-ease-in-out',
                    expanded ? 'e-grid-rows-[1fr]' : 'e-grid-rows-[0fr]',
                )}
            >
                <div className="e-overflow-hidden">
                    <div className="e-card">{children}</div>
                </div>
            </div>
        </section>
    );
}
