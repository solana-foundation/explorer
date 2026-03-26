import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/app/components/shared/utils';

const CHEVRON_SVG =
    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24'><path d='m6 9 6 6 6-6'/></svg>\")";

const MENU_SVG =
    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24'><path d='M3 12h18M3 6h18M3 18h18'/></svg>\")";

const ICON_MAP = {
    chevron: CHEVRON_SVG,
    menu: MENU_SVG,
} as const;

const nativeSelectVariants = cva(
    cn(
        'e-cursor-pointer e-appearance-none e-rounded e-border e-border-solid',
        'e-bg-no-repeat e-bg-[length:1rem] e-bg-[position:right_0.75rem_center]',
        'e-px-4 e-py-2.5 e-pr-10 e-text-sm',
        'e-outline-none e-transition-colors',
        'focus-visible:e-ring-2 focus-visible:e-ring-offset-2 focus-visible:e-ring-offset-neutral-900',
        'disabled:e-cursor-not-allowed disabled:e-opacity-50',
    ),
    {
        defaultVariants: {
            icon: 'chevron',
            variant: 'dark',
        },
        variants: {
            variant: {
                dark: cn(
                    'e-border-outer-space-950 e-bg-heavy-metal-900 e-text-neutral-200',
                    'focus-visible:e-ring-neutral-300',
                ),
                navigation: cn(
                    'e-border-outer-space-800 e-bg-heavy-metal-900 e-text-neutral-200',
                    'hover:e-border-outer-space-700',
                    'focus-visible:e-ring-accent-800',
                ),
            },
            icon: {
                chevron: '',
                menu: '',
            },
        },
    },
);

type NativeSelectVariants = VariantProps<typeof nativeSelectVariants>;

export type BaseNativeSelectProps = Omit<React.ComponentProps<'select'>, 'className'> &
    NativeSelectVariants & {
        className?: string;
    };

export const BaseNativeSelect = React.forwardRef<HTMLSelectElement, BaseNativeSelectProps>(
    ({ variant, icon = 'chevron', className, style, ...props }, ref) => (
        <select
            ref={ref}
            className={cn(nativeSelectVariants({ icon, variant }), className)}
            style={{ backgroundImage: ICON_MAP[icon ?? 'chevron'], ...style }}
            {...props}
        />
    ),
);

BaseNativeSelect.displayName = 'BaseNativeSelect';

export { nativeSelectVariants };
