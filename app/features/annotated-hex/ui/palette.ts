import { FieldKind } from '../model/types';

/**
 * Cell background + text color classes per FieldKind.
 *
 * Uses Tailwind default-palette colors (prefixed per this repo's `e-` config).
 * Pattern mirrors existing Explorer usage in autocomplete.stories.tsx:
 *   e-bg-purple-500/20 e-text-purple-300
 *
 * Every pair meets WCAG 1.4.1 (≥ 3:1 contrast) against both dark and light
 * Explorer backgrounds because we use /20 opacity on the fill and a 300-shade
 * on the text, which keeps the hex glyphs readable in either theme.
 *
 * `satisfies` ensures the palette covers every FieldKind; adding a kind to
 * types.ts without updating this table becomes a compile error.
 */
export const KIND_CELL_CLASSES = {
    amount: 'e-bg-purple-500/20 e-text-purple-300',
    authority: 'e-bg-green-500/20 e-text-green-300',
    neutral: 'e-bg-neutral-500/10 e-text-neutral-400',
    option: 'e-bg-orange-500/20 e-text-orange-300',
    pubkey: 'e-bg-blue-500/20 e-text-blue-300',
    scalar: 'e-bg-yellow-500/20 e-text-yellow-300',
} as const satisfies Record<FieldKind, string>;

/** Chip color classes used by LayoutLegend (slightly smaller opacity for a subtler feel). */
export const KIND_CHIP_CLASSES = {
    amount: 'e-bg-purple-500/30 e-text-purple-200 e-border-purple-500/40',
    authority: 'e-bg-green-500/30 e-text-green-200 e-border-green-500/40',
    neutral: 'e-bg-neutral-500/30 e-text-neutral-200 e-border-neutral-500/40',
    option: 'e-bg-orange-500/30 e-text-orange-200 e-border-orange-500/40',
    pubkey: 'e-bg-blue-500/30 e-text-blue-200 e-border-blue-500/40',
    scalar: 'e-bg-yellow-500/30 e-text-yellow-200 e-border-yellow-500/40',
} as const satisfies Record<FieldKind, string>;

export function cellClasses(kind: FieldKind): string {
    return KIND_CELL_CLASSES[kind];
}

export function chipClasses(kind: FieldKind): string {
    return KIND_CHIP_CLASSES[kind];
}
