import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/app/components/shared/utils';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

export const LABEL_WIDTH = 'w-[clamp(84px,20%,240px)]';

const rowVariants = cva('flex flex-row border-0 border-solid border-outer-space-850', {
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
            flat: 'gap-2',
        },
        divider: {
            false: '',
            true: 'border-b last:border-b-0',
        },
    },
});

const LABEL_CLASS = 'min-w-0 flex-none text-sm leading-5 text-outer-space-300 [overflow-wrap:normal]';

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
    ...rest
}: {
    label: React.ReactNode;
    trailing?: React.ReactNode;
    labelWidth?: string;
    className?: string;
    valueClassName?: string;
    children: React.ReactNode;
} & VariantProps<typeof rowVariants> &
    Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>) {
    return (
        <div className={cn(rowVariants({ align, density, divider }), className)} {...rest}>
            <div className={cn(LABEL_CLASS, labelWidth)}>{label}</div>
            <div className={cn('flex min-w-0 flex-1 text-sm [overflow-wrap:anywhere]', valueClassName)}>{children}</div>
            {trailing}
        </div>
    );
}
