import { cn } from '@components/shared/utils';
import React from 'react';
import { HelpCircle } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

// Card surface matched to the transaction tables — set on a `variant="tight"` Card. `!rounded-lg` (8px)
// forces the radius over the tw base's `rounded-xl` (12px) so it stays in step with the dashkit cards.
export const TIGHT_CARD = 'overflow-hidden !rounded-lg border-outer-space-800 bg-outer-space-900';

// Muted uppercase grid header cell, matching the transaction tables.
export const GRID_HEADER_CELL = 'text-xs uppercase text-outer-space-300';

// Column header label; when `help` is set it carries a help icon and a hover explanation. The icon is
// inline (not a flex item) so a long label wraps naturally with the icon trailing the last word.
export function HeaderLabel({ label, help }: { label: string; help?: string }) {
    if (!help) {
        return <>{label}</>;
    }
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="cursor-help">
                    {label}
                    <HelpCircle size={14} className="ml-1 inline align-text-bottom" />
                </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-72 normal-case">{help}</TooltipContent>
        </Tooltip>
    );
}

// Desktop grid header row shared by the block grid cards. Header and body rows use the same inline
// `style` template so their columns stay aligned; cells from `rightAlignFrom` onward are right-aligned.
export function GridHeaderRow({
    headers,
    style,
    rightAlignFrom,
}: {
    headers: { label: string; help?: string }[];
    style: React.CSSProperties;
    rightAlignFrom: number;
}) {
    return (
        <div
            style={style}
            className={cn(
                'hidden gap-5 border-b border-solid border-white/10 px-3 py-2.5 md:grid md:px-4',
                GRID_HEADER_CELL,
            )}
        >
            {headers.map((h, i) => (
                <div key={i} className={cn(i >= rightAlignFrom && 'text-right')}>
                    <HeaderLabel help={h.help} label={h.label} />
                </div>
            ))}
        </div>
    );
}

// Stacked, labelled key/value field for the block cards' mobile layouts. The label column width mirrors
// the Overview card's key/value grid so the cards line up.
const FIELD_ALIGN = { baseline: 'items-baseline', center: 'items-center', start: 'items-start' } as const;

export function LabeledField({
    label,
    children,
    align = 'baseline',
}: {
    label: string;
    children: React.ReactNode;
    align?: keyof typeof FIELD_ALIGN;
}) {
    return (
        <div className={cn('grid grid-cols-[clamp(100px,25%,200px)_1fr] gap-2', FIELD_ALIGN[align])}>
            <span className="text-outer-space-300">{label}</span>
            <span className="min-w-0">{children}</span>
        </div>
    );
}

// A count with its percentage in parentheses on one right-aligned mono line: "count (percent)".
export function BracketedFigure({ count, percent }: { count: string; percent: string }) {
    return (
        <div className="text-right tabular-nums">
            {count}
            <span className="text-outer-space-300"> ({percent})</span>
        </div>
    );
}

// "Load More" footer shared by the paginated block grid cards.
export function LoadMoreButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="border-t border-solid border-white/10 px-3 py-4 md:px-4">
            <Button ui="dashkit" variant="primary" className="w-full" onClick={onClick}>
                Load More
            </Button>
        </div>
    );
}
