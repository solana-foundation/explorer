import { cn, cnPrefixed } from '@components/shared/utils';
import React from 'react';
import { HelpCircle } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

// Data-table card surface, shared by the block grid cards (matches BaseDomainsCard's list surface). Set
// on a `variant="tight"` Card: `rounded-lg` (8px) tightens the tw base's `rounded-xl` (12px) and the
// outer-space border/bg recolour it. No `!important` needed — BaseCard composes className through
// `cnPrefixed` (tailwind-merge), so these later utilities win over the base card's own.
export const TIGHT_CARD = 'overflow-hidden rounded-lg border-outer-space-800 bg-outer-space-900';

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

// Percentage of `part` within `whole`, formatted to `digits` decimals. Guards the empty-block case
// (`whole === 0`, e.g. a block with no processed transactions/instructions) so it reads "0.00%" rather
// than "NaN%".
export function percentOf(part: number, whole: number, digits = 2): string {
    const value = whole === 0 ? 0 : (100 * part) / whole;
    return `${value.toFixed(digits)}%`;
}

// A count followed by its percentage in muted parentheses: "count (percent)". Rendered as a fragment so
// it drops into either a mobile field or a right-aligned desktop grid cell unchanged.
export function CountWithPercent({ count, percent }: { count: React.ReactNode; percent: string }) {
    return (
        <>
            {count}
            <span className="text-outer-space-300"> ({percent})</span>
        </>
    );
}

// One cell of a ResponsiveGridRow. `children` renders in both layouts; `mobile`/`desktop` override a
// single layout when they must differ (e.g. a signature that stacks its programs only on desktop).
export type ResponsiveCell = {
    key: string;
    label: string;
    children?: React.ReactNode;
    mobile?: React.ReactNode;
    desktop?: React.ReactNode;
    // Mobile field alignment (see LabeledField); defaults to 'baseline'.
    mobileAlign?: keyof typeof FIELD_ALIGN;
    // Extra classes on the desktop grid cell, e.g. 'text-right', 'min-w-0', 'tabular-nums'.
    desktopClassName?: string;
    // Drop the cell from one layout: a desktop-only column (pinned/first cell) or a mobile-only field
    // whose value is folded into another cell on desktop.
    hideMobile?: boolean;
    hideDesktop?: boolean;
};

// A data-table row rendered responsively from a single cell list: stacked labelled fields below md, a
// CSS grid (sharing the card's `gridStyle` column template) at md and up. Centralises the two-branch
// layout the block grid cards would otherwise each duplicate. Row containers default to the block cards'
// common spacing; `mobileClassName`/`desktopClassName` tweak it per card (merged with tailwind-merge).
export function ResponsiveGridRow({
    cells,
    gridStyle,
    pinnedTopRight,
    mobileClassName,
    desktopClassName,
}: {
    cells: ResponsiveCell[];
    gridStyle: React.CSSProperties;
    // Absolutely-positioned element in the mobile card corner (e.g. the transaction index).
    pinnedTopRight?: React.ReactNode;
    mobileClassName?: string;
    desktopClassName?: string;
}) {
    return (
        <div className="border-b border-solid border-white/10 last:border-b-0">
            <div className={cnPrefixed('flex flex-col gap-1 px-3 py-3 md:hidden md:px-4', mobileClassName)}>
                {pinnedTopRight}
                {cells
                    .filter(cell => !cell.hideMobile)
                    .map(cell => (
                        <LabeledField key={cell.key} label={cell.label} align={cell.mobileAlign}>
                            {cell.mobile ?? cell.children}
                        </LabeledField>
                    ))}
            </div>

            <div
                style={gridStyle}
                className={cnPrefixed('hidden items-start gap-5 px-3 py-2.5 md:grid md:px-4', desktopClassName)}
            >
                {cells
                    .filter(cell => !cell.hideDesktop)
                    .map(cell => (
                        <div key={cell.key} className={cn(cell.desktopClassName)}>
                            {cell.desktop ?? cell.children}
                        </div>
                    ))}
            </div>
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
