import React from 'react';

import { cn } from '@/app/components/shared/utils';

// Label column width shared across the redesigned account/program cards: 20% of the card
// width, clamped to [84px, 240px]. Shared across every row (the section rows and the Raw-view
// rows) so their values line up in one column.
export const LABEL_WIDTH = 'w-[clamp(84px,20%,240px)]';

/**
 * A key-value row: a fixed-width label column ("key") beside a flexible value column, aligned
 * on the text baseline. `density="compact"` tightens the padding for drawer/mobile rows.
 */
export function KeyValue({
    label,
    trailing,
    labelWidth = 'sm:w-56',
    density = 'comfortable',
    divider = true,
    className,
    valueClassName,
    children,
}: {
    label: React.ReactNode;
    trailing?: React.ReactNode;
    labelWidth?: string;
    density?: 'comfortable' | 'compact';
    divider?: boolean;
    className?: string;
    valueClassName?: string;
    children: React.ReactNode;
}) {
    const compact = density === 'compact';
    return (
        <div
            className={cn(
                'flex flex-row items-baseline border-0 border-solid border-dark-border',
                divider && 'border-b last:border-b-0',
                compact ? 'gap-3 py-2' : 'gap-dk-4 px-3 py-2',
                className,
            )}
        >
            <div
                className={cn('min-w-0 flex-none text-outer-space-300', labelWidth)}
                style={{
                    fontSize: 14,
                    // Wrap a too-long key onto multiple lines: hyphenate per the document's
                    // language rules first, then break an unbreakable run so it never overflows
                    // the label column.
                    hyphens: 'auto',
                    lineHeight: '20px',
                    overflowWrap: 'break-word',
                    // Baseline shim: drop the 14px label's baseline onto the row baseline.
                    // Comfortable rows sit in a 24px line-box (pt 3 / pb 1); compact rows fill
                    // the 20px line-box exactly (no shim).
                    paddingBottom: compact ? 0 : 1,
                    paddingTop: compact ? 0 : 3,
                }}
            >
                {label}
            </div>
            <div className={cn('flex min-w-0 flex-1 text-sm [overflow-wrap:anywhere]', valueClassName)}>{children}</div>
            {trailing}
        </div>
    );
}
