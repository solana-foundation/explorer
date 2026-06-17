import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// `ui` picks the visual lineage, mirroring BaseCard / BaseTable. `dashkit` emits the raw Bootstrap
// `.badge` + `.bg-*-soft` / `.bg-*` classes that the rest of the app currently uses so migrations don't
// change visuals; the dashkit branch + the dashkit-only variant values get deleted once the dashkit
// SCSS is gone.
const badgeVariants = cva([], {
    compoundVariants: [
        // ===== ui="tw" =====
        {
            class: cn(
                'e-inline-flex e-items-center e-justify-center',
                'e-px-2 e-py-0.5 e-font-medium e-w-fit e-whitespace-nowrap e-shrink-0',
                '[&_svg]:e-size-3 e-gap-1 [&_svg]:e-pointer-events-none',
            ),
            ui: 'tw',
        },
        { as: 'badge', class: 'e-rounded', ui: 'tw' },
        { as: 'link', class: 'e-rounded-sm', size: 'xs', ui: 'tw' },
        {
            as: 'link',
            class: 'e-py-0.5 e-px-2 e-text-[0.8125rem] e-leading-[1.75] e-rounded',
            size: 'sm',
            ui: 'tw',
        },
        { as: 'link', class: 'e-rounded-md', size: 'md', ui: 'tw' },
        { as: 'link', class: 'e-rounded-md', size: 'lg', ui: 'tw' },
        { class: 'e-text-lg', size: 'lg', ui: 'tw' },
        { class: 'e-text-md', size: 'md', ui: 'tw' },
        { class: 'e-text-sm', size: 'sm', ui: 'tw' },
        { class: 'e-text-xs', size: 'xs', ui: 'tw' },
        { class: 'e-shadow-active', status: 'active', ui: 'tw' },
        {
            class: 'e-border-transparent e-text-neutral-200 [&_a]:e-text-neutral-200 [&_a]:hover:e-text-neutral-100',
            ui: 'tw',
            variant: 'default',
        },
        { class: 'e-border-transparent e-bg-destructive e-text-white', ui: 'tw', variant: 'destructive' },
        { class: 'e-border-transparent e-bg-teal-900 e-text-teal-400', ui: 'tw', variant: 'info' },
        { class: 'e-border-transparent e-bg-neutral-400 e-text-neutral-800', ui: 'tw', variant: 'secondary' },
        { class: 'e-border-transparent e-text-green-400 e-bg-green-900', ui: 'tw', variant: 'success' },
        {
            class: 'e-border-transparent e-bg-transparent e-text-neutral-200 [&_a]:e-text-neutral-200 [&_a]:hover:e-text-neutral-100',
            ui: 'tw',
            variant: 'transparent',
        },
        { class: 'e-border-transparent e-bg-orange-950 e-text-orange-400', ui: 'tw', variant: 'warning' },

        // ===== ui="dashkit" =====
        // Base `.badge` layout, matching dashkit `_badge.scss` + Bootstrap `.badge`:
        // 76% font-size, line-height 1, vertical-align middle, em-based padding (0.33em y, 0.5em x).
        // Padding-x and rounded live on per-pill compounds — twMerge can't dedupe through the
        // e- prefix, so non-pill horizontal padding/rounded would beat the pill compound's
        // arbitrary values in CSS source order if listed here.
        {
            class: 'e-inline-block e-align-middle e-text-center e-whitespace-nowrap e-font-normal e-leading-none e-text-[76%] e-py-[0.33em] empty:e-hidden',
            ui: 'dashkit',
        },
        // pill=false: dashkit default — em-based horizontal padding + Bootstrap radius.
        { class: 'e-px-[0.5em] e-rounded-[0.375rem]', pill: false, ui: 'dashkit' },
        // size="sm" in dashkit mode mirrors the in-table appearance (parent `<td>` with 13px font
        // → ≈10px). Useful when rendering a dashkit badge OUTSIDE a table while still wanting the compact look.
        { class: 'e-text-dk-xs', size: 'sm', ui: 'dashkit' },
        {
            class: 'e-bg-[#116939] e-text-[#26e97e] [&[href]]:hover:e-bg-[#0d532d] [&[href]]:focus:e-bg-[#0d532d]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'success',
        },
        {
            class: 'e-bg-[#1e5159] e-text-[#43b5c5] [&[href]]:hover:e-bg-[#184046] [&[href]]:focus:e-bg-[#184046]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'info',
        },
        {
            class: 'e-bg-[#712c71] e-text-[#fa62fc] [&[href]]:hover:e-bg-[#5f255f] [&[href]]:focus:e-bg-[#5f255f]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'warning',
        },
        // `destructive` (TW-flavored) and `danger` (Bootstrap-flavored) both resolve to the danger-soft palette in dashkit mode.
        {
            class: 'e-bg-[#512965] e-text-[#b45be1] [&[href]]:hover:e-bg-[#422253] [&[href]]:focus:e-bg-[#422253]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'destructive',
        },
        {
            class: 'e-bg-[#512965] e-text-[#b45be1] [&[href]]:hover:e-bg-[#422253] [&[href]]:focus:e-bg-[#422253]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'danger',
        },
        {
            class: 'e-bg-[#2f3c3b] e-text-[#698582] [&[href]]:hover:e-bg-[#242e2d] [&[href]]:focus:e-bg-[#242e2d]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'secondary',
        },
        {
            class: 'e-bg-[#3c5352] e-text-[#86b8b6] [&[href]]:hover:e-bg-[#314443] [&[href]]:focus:e-bg-[#314443]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'gray',
        },
        // shade-55% of $dark (#1b4e3f) per dark-theme $bg-soft-scale; hover = darken 5% like the other softs
        {
            class: 'e-bg-[#0c231c] e-text-[#1b4e3f] [&[href]]:hover:e-bg-[#05100d] [&[href]]:focus:e-bg-[#05100d]',
            tone: 'soft',
            ui: 'dashkit',
            variant: 'dark',
        },
        // Solid success uses dark text (#1b4e3f) against bright green — unique among solids, which all use white.
        { class: 'e-bg-[#26e97e] e-text-[#1b4e3f]', tone: 'solid', ui: 'dashkit', variant: 'success' },
        { class: 'e-bg-[#43b5c5] e-text-white', tone: 'solid', ui: 'dashkit', variant: 'info' },
        // Dark text on bright `$warning` (#fa62fc) — matches the legacy `bg-warning text-dark` pairing in FeatureAccountSection.
        { class: 'e-bg-[#fa62fc] e-text-[#1b4e3f]', tone: 'solid', ui: 'dashkit', variant: 'warning' },
        { class: 'e-bg-[#b45be1] e-text-white', tone: 'solid', ui: 'dashkit', variant: 'destructive' },
        { class: 'e-bg-[#b45be1] e-text-white', tone: 'solid', ui: 'dashkit', variant: 'danger' },
        { class: 'e-bg-[#698582] e-text-white', tone: 'solid', ui: 'dashkit', variant: 'secondary' },
        { class: 'e-bg-[#1b4e3f] e-text-white', tone: 'solid', ui: 'dashkit', variant: 'dark' },
        // Pill must follow base so `e-px-[0.6em]` wins over the umbrella `e-px-2`.
        { class: 'e-rounded-[50rem] e-px-[0.6em]', pill: true, ui: 'dashkit' },
    ],
    defaultVariants: {
        as: 'badge',
        pill: false,
        size: 'xs',
        status: 'inactive',
        tone: 'soft',
        ui: 'tw',
        variant: 'default',
    },
    variants: {
        as: { badge: '', link: '' },
        pill: { false: '', true: '' },
        size: { lg: '', md: '', sm: '', xs: '' },
        status: { active: '', inactive: '' },
        tone: { soft: '', solid: '' },
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

    return (
        <Comp
            data-slot="badge"
            data-variant={variant ?? 'default'}
            className={cn(badgeVariants({ as, pill, size, status, tone, ui, variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
