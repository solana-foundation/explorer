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
                className="h-9 w-9 shrink-0 rounded-lg object-cover"
                src={icon}
                onError={() => setError(true)}
            />
        );
    }

    return (
        <div
            className={cn(
                'flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-lg',
                'bg-heavy-metal-600 text-sm font-bold text-heavy-metal-200',
            )}
        >
            {label.charAt(0).toUpperCase()}
        </div>
    );
}

export function SearchResultItem({ option }: { option: SearchItem }) {
    return (
        <div className="flex items-center gap-3">
            <EntityIcon icon={option.icon} label={option.label} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">{option.label}</span>
                    {option.verified && <VerifiedBadge />}
                </div>
                {option.sublabel && (
                    <span className="block truncate font-mono text-xs text-heavy-metal-300">
                        {option.sublabel}
                    </span>
                )}
                {option.verified && option.pathname.includes('/verified-build') && (
                    <span className="block text-xs text-heavy-metal-400">
                        Source verified — Make sure you trust the source code
                    </span>
                )}
            </div>
        </div>
    );
}
