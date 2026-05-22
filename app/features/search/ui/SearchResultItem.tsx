import { cn } from '@shared/utils';
import { useEffect, useState } from 'react';

import type { SearchItem } from '../lib/types';
import { VerifiedBadge } from './VerifiedBadge';

function EntityIcon({ icon, label }: { icon?: string; label: string }) {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [icon]);

    if (icon && !error) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                alt={`entity-icon-${label}`}
                className="e-h-9 e-w-9 e-shrink-0 e-rounded-lg e-object-cover"
                src={icon}
                onError={() => setError(true)}
            />
        );
    }

    return (
        <div
            className={cn(
                'e-flex e-h-9 e-w-9 e-shrink-0 e-select-none e-items-center e-justify-center e-rounded-lg',
                'e-bg-heavy-metal-600 e-text-sm e-font-bold e-text-heavy-metal-200',
            )}
        >
            {label.charAt(0).toUpperCase()}
        </div>
    );
}

export function SearchResultItem({ option }: { option: SearchItem }) {
    return (
        <div className="e-flex e-items-center e-gap-3">
            <EntityIcon icon={option.icon} label={option.label} />
            <div className="e-min-w-0 e-flex-1">
                <div className="e-flex e-items-center e-justify-between e-gap-2">
                    <span className="e-truncate e-text-sm e-font-medium e-text-white">{option.label}</span>
                    {option.verified && <VerifiedBadge />}
                </div>
                {option.sublabel && (
                    <span className="e-block e-truncate e-font-mono e-text-xs e-text-heavy-metal-300">
                        {option.sublabel}
                    </span>
                )}
            </div>
        </div>
    );
}
