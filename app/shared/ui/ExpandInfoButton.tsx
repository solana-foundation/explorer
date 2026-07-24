import React from 'react';
import { Info } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

export function ExpandInfoButton({
    isExpanded,
    onToggle,
    controlsId,
}: {
    isExpanded: boolean;
    onToggle: () => void;
    controlsId: string;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-controls={controlsId}
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
            className={cn(
                'inline-flex h-6 w-6 items-center justify-center',
                'rounded-full border-0 bg-transparent p-0 leading-none',
                'text-dark-muted-foreground hover:bg-dark-background hover:text-white',
                isExpanded && 'bg-dark-background text-dark-accent',
            )}
        >
            <Info size={14} />
        </button>
    );
}
