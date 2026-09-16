import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/app/components/shared/utils';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

// Shared label-column width so values line up in one column across every card and Raw-view row.
export const LABEL_WIDTH = 'w-[clamp(84px,20%,240px)]';

const rowVariants = cva('flex flex-row border-0 border-solid border-dark-border', {
    defaultVariants: { align: 'baseline', density: 'comfortable', divider: true },
    variants: {
        align: {
            baseline: 'items-baseline',
            center: 'items-center',
            start: 'items-start',
        },
        density: {
            comfortable: `gap-dk-4 ${ROW_PADDING}`,
            compact: 'gap-2 py-1',
            // `flat` carries no padding of its own — the parent controls the rhythm (used by the
            // gap-driven expanded-account rows and the block tables' mobile cells).
            flat: 'gap-2',
        },
        divider: {
            false: '',
            true: 'border-b last:border-b-0',
        },
    },
});

const labelVariants = cva(
    'min-w-0 flex-none text-sm leading-5 text-outer-space-300 [overflow-wrap:normal]',
    {
        defaultVariants: { density: 'comfortable' },
        variants: {
            // Baseline shim: nudge the label onto the row baseline (comfortable rows only).
            density: {
                comfortable: 'pb-px pt-[3px]',
                compact: 'py-0',
                flat: 'py-0',
            },
        },
    },
);

/**
 * A key-value row: a fixed-width label column beside a flexible value column. `density` sets the
 * padding (comfortable cards / compact drawers / flat gap-driven rows); `align` sets the cross-axis
 * alignment; `divider` draws a bottom border between rows.
 */
export function KeyValue({
    label,
    trailing,
    labelWidth = LABEL_WIDTH,
    align = 'baseline',
    density = 'comfortable',
    divider = true,
    className,
    valueClassName,
    children,
}: {
    label: React.ReactNode;
    trailing?: React.ReactNode;
    labelWidth?: string;
    className?: string;
    valueClassName?: string;
    children: React.ReactNode;
} & VariantProps<typeof rowVariants>) {
    return (
        <div className={cn(rowVariants({ align, density, divider }), className)}>
            <div className={cn(labelVariants({ density }), labelWidth)}>{label}</div>
            <div className={cn('flex min-w-0 flex-1 text-sm [overflow-wrap:anywhere]', valueClassName)}>{children}</div>
            {trailing}
        </div>
    );
}
