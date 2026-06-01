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
                'e-inline-flex e-h-6 e-w-6 e-items-center e-justify-center',
                'e-rounded-full e-border-0 e-bg-transparent e-p-0 e-leading-none',
                'e-text-dk-gray-700 hover:e-bg-dk-black-dark hover:e-text-dk-white',
                isExpanded && 'e-bg-dk-black-dark e-text-dk-primary-on-dark',
            )}
        >
            <Info size={14} />
        </button>
    );
}
