// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// styles.css colors every anchor green (`a { color:#33a382 }`, `a:hover { color:#2b8a6e }`). When a
// tw badge is itself an anchor (`asChild` → `<a>`) or wraps one, that global rule overrides the
// variant's own text color on hover — a purple tag would flip to green. Each tw variant below
// therefore re-asserts its text color for the badge-as-anchor (`[&[href]]:hover:`) and nested-anchor
// (`[&_a]:` / `[&_a]:hover:`) cases so hovering a tag never shifts its palette. These must stay as
// full literal class strings: Tailwind v3 scans raw source and won't emit classes assembled at runtime.

// `ui` picks the visual lineage, mirroring BaseCard / BaseTable. `dashkit` emits the raw Bootstrap
// `.badge` + `.bg-*-soft` / `.bg-*` classes that the rest of the app currently uses so migrations don't
// change visuals; the dashkit branch + the dashkit-only variant values get deleted once the dashkit
// SCSS is gone.
const badgeVariants = cva([], {
    compoundVariants: [
        // ===== ui="tw" =====
        {
            class: cn(
                'inline-flex items-center justify-center',
                // whitespace-normal (not nowrap): a tw badge whose text is wider than the space it
                // sits in wraps to a second line instead of overflowing. w-fit still shrinks it to
                // content when there's room.
                'px-1.5 py-0.5 font-medium w-fit whitespace-normal shrink-0',
                '[&_svg]:size-3 gap-1 [&_svg]:pointer-events-none',
            ),
            ui: 'tw',
        },
        { as: 'badge', class: 'rounded-md', ui: 'tw' },
        { as: 'link', class: 'rounded-sm', size: 'xs', ui: 'tw' },
        {
            as: 'link',
            class: 'py-0.5 px-2 text-[0.8125rem] leading-[1.75] rounded',
            size: 'sm',
            ui: 'tw',
        },
        { as: 'link', class: 'rounded-md', size: 'md', ui: 'tw' },
        { as: 'link', class: 'rounded-md', size: 'lg', ui: 'tw' },
        { class: 'text-lg', size: 'lg', ui: 'tw' },
        { class: 'text-md', size: 'md', ui: 'tw' },
        { class: 'text-sm', size: 'sm', ui: 'tw' },
        { class: 'text-xs', size: 'xs', ui: 'tw' },
        { class: 'shadow-active', status: 'active', ui: 'tw' },
        // --- tw / tone="original" — the standard Tailwind-palette treatment (default for tw). ---
        {
            class: 'border-transparent text-neutral-200 [&_a]:text-neutral-200 [&[href]]:hover:text-neutral-200 [&_a]:hover:text-neutral-200',
            tone: 'original',
            ui: 'tw',
            variant: 'default',
        },
        {
            class: 'border-transparent bg-destructive text-white [&_a]:text-white [&[href]]:hover:text-white [&_a]:hover:text-white',
            tone: 'original',
            ui: 'tw',
            variant: 'destructive',
        },
        // Soft counterpart to `destructive` (which is solid red/white) — mirrors the soft
        // treatment success/warning already get, for error states that shouldn't shout.
        {
            class: 'border-transparent bg-red-950 text-red-400 [&_a]:text-red-400 [&[href]]:hover:text-red-400 [&_a]:hover:text-red-400',
            tone: 'original',
            ui: 'tw',
            variant: 'danger',
        },
        {
            class: 'border-transparent bg-teal-900 text-teal-400 [&_a]:text-teal-400 [&[href]]:hover:text-teal-400 [&_a]:hover:text-teal-400',
            tone: 'original',
            ui: 'tw',
            variant: 'info',
        },
        {
            class: 'border-transparent bg-neutral-400 text-neutral-800 [&_a]:text-neutral-800 [&[href]]:hover:text-neutral-800 [&_a]:hover:text-neutral-800',
            tone: 'original',
            ui: 'tw',
            variant: 'secondary',
        },
        {
            class: 'border-transparent bg-green-900 text-green-400 [&_a]:text-green-400 [&[href]]:hover:text-green-400 [&_a]:hover:text-green-400',
            tone: 'original',
            ui: 'tw',
            variant: 'success',
        },
        {
            class: 'border-transparent bg-transparent text-neutral-200 [&_a]:text-neutral-200 [&[href]]:hover:text-neutral-200 [&_a]:hover:text-neutral-200',
            tone: 'original',
            ui: 'tw',
            variant: 'transparent',
        },
        {
            class: 'border-transparent bg-orange-950 text-orange-400 [&_a]:text-orange-400 [&[href]]:hover:text-orange-400 [&_a]:hover:text-orange-400',
            tone: 'original',
            ui: 'tw',
            variant: 'warning',
        },

        // --- tw / tone="soft" — the dashkit soft palette rebuilt on the clean tw badge.
        // Same hues/values as the ui="dashkit" soft variants, but riding the tw base layout
        // (rounded/px-1.5/py-0.5/text-xs) instead of the Bootstrap `.badge` sizing. When the
        // dashkit lineage is deleted these carry the soft look forward on pure tw. ---
        {
            class: 'border-transparent text-neutral-200 [&_a]:text-neutral-200 [&[href]]:hover:text-neutral-200 [&_a]:hover:text-neutral-200',
            tone: 'soft',
            ui: 'tw',
            variant: 'default',
        },
        {
            class: 'border-transparent bg-[#512965] text-[#b45be1] [&_a]:text-[#b45be1] [&[href]]:hover:text-[#b45be1] [&_a]:hover:text-[#b45be1]',
            tone: 'soft',
            ui: 'tw',
            variant: 'destructive',
        },
        {
            class: 'border-transparent bg-[#512965] text-[#b45be1] [&_a]:text-[#b45be1] [&[href]]:hover:text-[#b45be1] [&_a]:hover:text-[#b45be1]',
            tone: 'soft',
            ui: 'tw',
            variant: 'danger',
        },
        {
            class: 'border-transparent bg-[#1e5159] text-[#43b5c5] [&_a]:text-[#43b5c5] [&[href]]:hover:text-[#43b5c5] [&_a]:hover:text-[#43b5c5]',
            tone: 'soft',
            ui: 'tw',
            variant: 'info',
        },
        {
            class: 'border-transparent bg-[#2f3c3b] text-[#698582] [&_a]:text-[#698582] [&[href]]:hover:text-[#698582] [&_a]:hover:text-[#698582]',
            tone: 'soft',
            ui: 'tw',
            variant: 'secondary',
        },
        {
            class: 'border-transparent bg-[#3c5352] text-[#86b8b6] [&_a]:text-[#86b8b6] [&[href]]:hover:text-[#86b8b6] [&_a]:hover:text-[#86b8b6]',
            tone: 'soft',
            ui: 'tw',
            variant: 'gray',
        },
        {
            class: 'border-transparent bg-[#0c231c] text-[#1b4e3f] [&_a]:text-[#1b4e3f] [&[href]]:hover:text-[#1b4e3f] [&_a]:hover:text-[#1b4e3f]',
            tone: 'soft',
            ui: 'tw',
            variant: 'dark',
        },
        {
            class: 'border-transparent bg-[#116939] text-[#26e97e] [&_a]:text-[#26e97e] [&[href]]:hover:text-[#26e97e] [&_a]:hover:text-[#26e97e]',
            tone: 'soft',
            ui: 'tw',
            variant: 'success',
        },
        {
            class: 'border-transparent bg-transparent text-neutral-200 [&_a]:text-neutral-200 [&[href]]:hover:text-neutral-200 [&_a]:hover:text-neutral-200',
            tone: 'soft',
            ui: 'tw',
            variant: 'transparent',
        },
        {
            class: 'border-transparent bg-[#712c71] text-[#fa62fc] [&_a]:text-[#fa62fc] [&[href]]:hover:text-[#fa62fc] [&_a]:hover:text-[#fa62fc]',
            tone: 'soft',
            ui: 'tw',
            variant: 'warning',
        },

        // ===== ui="dashkit" =====
        // Base `.badge` layout, matching dashkit `_badge.scss` + Bootstrap `.badge`:
        // 76% font-size, line-height 1, vertical-align middle, em-based padding (0.33em y, 0.5em x).
        // Padding-x and rounded live on per-pill compounds — cn (clsx) keeps all classes, so
        // non-pill horizontal padding/rounded would beat the pill compound's
        // arbitrary values in CSS source order if listed here.
        {
            class: 'inline-block align-middle text-center whitespace-nowrap font-normal leading-none text-[76%] py-[0.33em] empty:hidden',
            ui: 'dashkit',
        },
        // pill=false: dashkit default — em-based horizontal padding + Bootstrap radius.
        { class: 'px-[0.5em] rounded-[0.375rem]', pill: false, ui: 'dashkit' },
        // size="sm" in dashkit mode mirrors the in-table appearance (parent `<td>` with 13px font
        // → ≈10px). Useful when rendering a dashkit badge OUTSIDE a table while still wanting the compact look.
        { class: 'text-dk-xs', size: 'sm', ui: 'dashkit' },
        {
            class: 'bg-[#116939] text-[#26e97e] [&[href]]:hover:bg-[#0d532d] [&[href]]:focus:bg-[#0d532d]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'success',
        },
        {
            class: 'bg-[#1e5159] text-[#43b5c5] [&[href]]:hover:bg-[#184046] [&[href]]:focus:bg-[#184046]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'info',
        },
        {
            class: 'bg-[#712c71] text-[#fa62fc] [&[href]]:hover:bg-[#5f255f] [&[href]]:focus:bg-[#5f255f]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'warning',
        },
        // `destructive` (TW-flavored) and `danger` (Bootstrap-flavored) both resolve to the danger-soft palette in dashkit mode.
        {
            class: 'bg-[#512965] text-[#b45be1] [&[href]]:hover:bg-[#422253] [&[href]]:focus:bg-[#422253]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'destructive',
        },
        {
            class: 'bg-[#512965] text-[#b45be1] [&[href]]:hover:bg-[#422253] [&[href]]:focus:bg-[#422253]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'danger',
        },
        {
            class: 'bg-[#2f3c3b] text-[#698582] [&[href]]:hover:bg-[#242e2d] [&[href]]:focus:bg-[#242e2d]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'secondary',
        },
        {
            class: 'bg-[#3c5352] text-[#86b8b6] [&[href]]:hover:bg-[#314443] [&[href]]:focus:bg-[#314443]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'gray',
        },
        // shade-55% of $dark (#1b4e3f) per dark-theme $bg-soft-scale; hover = darken 5% like the other softs
        {
            class: 'bg-[#0c231c] text-[#1b4e3f] [&[href]]:hover:bg-[#05100d] [&[href]]:focus:bg-[#05100d]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'dark',
        },
        // Solid success uses dark text (#1b4e3f) against bright green — unique among solids, which all use white.
        { class: 'bg-[#26e97e] text-[#1b4e3f]', tone: 'solid', ui: 'dashkit', variant: 'success' },
        { class: 'bg-[#43b5c5] text-white', tone: 'solid', ui: 'dashkit', variant: 'info' },
        // Dark text on bright `$warning` (#fa62fc) — matches the legacy `bg-warning text-dark` pairing in FeatureAccountSection.
        { class: 'bg-[#fa62fc] text-[#1b4e3f]', tone: 'solid', ui: 'dashkit', variant: 'warning' },
        { class: 'bg-[#b45be1] text-white', tone: 'solid', ui: 'dashkit', variant: 'destructive' },
        { class: 'bg-[#b45be1] text-white', tone: 'solid', ui: 'dashkit', variant: 'danger' },
        { class: 'bg-[#698582] text-white', tone: 'solid', ui: 'dashkit', variant: 'secondary' },
        { class: 'bg-[#1b4e3f] text-white', tone: 'solid', ui: 'dashkit', variant: 'dark' },
        // Pill must follow base so `px-[0.6em]` wins over the umbrella `px-2`.
        { class: 'rounded-[50rem] px-[0.6em]', pill: true, ui: 'dashkit' },
    ],
    // cva default tone is `original` (the tw default, and what bare `badgeVariants(...)` callers
    // get). The dashkit lineage's historical `soft` default is applied in the Badge component
    // below, which resolves tone per-`ui` before handing it to cva.
    defaultVariants: {
        as: 'badge',
        pill: false,
        size: 'xs',
        status: 'inactive',
        tone: 'original',
        ui: 'tw',
        variant: 'default',
    },
    variants: {
        as: { badge: '', link: '' },
        pill: { false: '', true: '' },
        size: { lg: '', md: '', sm: '', xs: '' },
        status: { active: '', inactive: '' },
        tone: { original: '', soft: '', solid: '' },
        ui: { dashkit: '', tw: '' },
        variant: {
            danger: '',
            dark: '',
            default: '',
            destructive: '',
            gray: '',
            info: '',
            secondary: '',
            success: '',
            transparent: '',
            warning: '',
        },
    },
});

function Badge({
    className,
    as,
    pill,
    size,
    status,
    tone,
    ui,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'span';

    // Per-lineage tone default: the tw badge is "original" unless asked for "soft"; the dashkit
    // badge stays "soft" (its historical default). Solid remains opt-in for both.
    const resolvedUi = ui ?? 'tw';
    const resolvedTone = tone ?? (resolvedUi === 'dashkit' ? 'soft' : 'original');

    return (
        <Comp
            data-slot="badge"
            data-variant={variant ?? 'default'}
            className={cn(
                badgeVariants({ as, pill, size, status, tone: resolvedTone, ui: resolvedUi, variant }),
                className,
            )}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
