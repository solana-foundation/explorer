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
        { class: 'badge', ui: 'dashkit' },
        // size="sm" in dashkit mode mirrors the in-table appearance (parent `<td>` with 13px font
        // → `.badge { font-size: 0.75em }` → ≈10px). Useful when rendering a dashkit badge OUTSIDE
        // a table while still wanting the compact look.
        { class: 'e-text-dk-xs', size: 'sm', ui: 'dashkit' },
        { class: 'bg-success-soft', tone: 'soft', ui: 'dashkit', variant: 'success' },
        { class: 'bg-info-soft', tone: 'soft', ui: 'dashkit', variant: 'info' },
        { class: 'bg-warning-soft', tone: 'soft', ui: 'dashkit', variant: 'warning' },
        // `destructive` (TW-flavored) and `danger` (Bootstrap-flavored) both emit `bg-danger-soft` in dashkit mode.
        { class: 'bg-danger-soft', tone: 'soft', ui: 'dashkit', variant: 'destructive' },
        { class: 'bg-danger-soft', tone: 'soft', ui: 'dashkit', variant: 'danger' },
        { class: 'bg-secondary-soft', tone: 'soft', ui: 'dashkit', variant: 'secondary' },
        { class: 'bg-gray-soft', tone: 'soft', ui: 'dashkit', variant: 'gray' },
        { class: 'bg-success', tone: 'solid', ui: 'dashkit', variant: 'success' },
        { class: 'bg-info', tone: 'solid', ui: 'dashkit', variant: 'info' },
        // text-dark forces dark text against the bright `$warning` (#fa62fc) — matches the legacy
        // `bg-warning text-dark` pairing in FeatureAccountSection.
        { class: 'bg-warning text-dark', tone: 'solid', ui: 'dashkit', variant: 'warning' },
        { class: 'bg-danger', tone: 'solid', ui: 'dashkit', variant: 'destructive' },
        { class: 'bg-danger', tone: 'solid', ui: 'dashkit', variant: 'danger' },
        { class: 'bg-secondary', tone: 'solid', ui: 'dashkit', variant: 'secondary' },
        { class: 'bg-dark', tone: 'solid', ui: 'dashkit', variant: 'dark' },
        { class: 'rounded-pill', pill: true, ui: 'dashkit' },
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
            className={cn(badgeVariants({ as, pill, size, status, tone, ui, variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
