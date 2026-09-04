import { cn } from '@components/shared/utils';
import React from 'react';

// Grid-based key/value row shared by the transaction summary and the block overview so the two pages'
// detail cards stay consistent. The `1fr` value column lets long mono values wrap (`break-all`) instead
// of forcing the card into horizontal scroll on narrow screens.
type RowProps = React.HTMLAttributes<HTMLDivElement> & { divider?: boolean };
export function Row({ children, className, divider, ...props }: RowProps) {
    return (
        <div
            className={cn(
                'grid min-h-9 grid-cols-[clamp(100px,25%,200px)_1fr] items-baseline gap-2 px-3 py-2.5 md:px-4',
                divider && 'border-1 border-b border-white/10 [border-bottom-style:solid]',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function Label({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-wrap items-center gap-1 overflow-hidden text-sm text-outer-space-300', className)}
            {...props}
        >
            {children}
        </div>
    );
}

// `mono` toggles the monospace face — on for hashes/addresses/numbers, off for prose like dates.
// `breakAll` lets a long unbreakable token (a hash) wrap anywhere; turn it off for space-separated
// prose so words only break at spaces.
type ValueProps = React.HTMLAttributes<HTMLDivElement> & { mono?: boolean; breakAll?: boolean };
export function Value({ children, className, mono = true, breakAll = true, ...props }: ValueProps) {
    return (
        <div className={cn('text-sm text-white', breakAll && 'break-all', mono && 'font-mono', className)} {...props}>
            {children}
        </div>
    );
}
