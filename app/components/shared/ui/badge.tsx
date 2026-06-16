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
                'inline-flex items-center justify-center',
                'px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0',
                '[&_svg]:size-3 gap-1 [&_svg]:pointer-events-none',
            ),
            ui: 'tw',
        },
        { as: 'badge', class: 'rounded', ui: 'tw' },
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
        {
            class: 'border-transparent text-neutral-200 [&_a]:text-neutral-200 [&_a]:hover:text-neutral-100',
            ui: 'tw',
            variant: 'default',
        },
        { class: 'border-transparent bg-destructive text-white', ui: 'tw', variant: 'destructive' },
        { class: 'border-transparent bg-teal-900 text-teal-400', ui: 'tw', variant: 'info' },
        { class: 'border-transparent bg-neutral-400 text-neutral-800', ui: 'tw', variant: 'secondary' },
        { class: 'border-transparent text-green-400 bg-green-900', ui: 'tw', variant: 'success' },
        {
            class: 'border-transparent bg-transparent text-neutral-200 [&_a]:text-neutral-200 [&_a]:hover:text-neutral-100',
            ui: 'tw',
            variant: 'transparent',
        },
        { class: 'border-transparent bg-orange-950 text-orange-400', ui: 'tw', variant: 'warning' },

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
