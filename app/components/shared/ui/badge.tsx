import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const badgeVariants = cva(
    'e-inline-flex e-items-center e-justify-center e-border e-border-neutral-200 e-px-2 e-py-0.5 e-font-medium e-w-fit e-whitespace-nowrap e-shrink-0 [&>svg]:e-size-3 e-gap-1 [&>svg]:e-pointer-events-none focus-visible:e-border-neutral-950 focus-visible:e-ring-neutral-950/50 focus-visible:e-ring-[3px] aria-invalid:e-ring-red-500/20 dark:aria-invalid:e-ring-red-500/40 aria-invalid:e-border-red-500 e-transition-[color,box-shadow] e-overflow-hidden dark:e-border-neutral-800 dark:focus-visible:e-border-neutral-300 dark:focus-visible:e-ring-neutral-300/50 dark:aria-invalid:e-ring-red-900/20 dark:aria-invalid:e-ring-red-900/40 dark:aria-invalid:e-border-red-900',
    {
        compoundVariants: [
            {
                as: 'link',
                class: 'e-rounded-sm',
                size: 'xs',
            },
            {
                as: 'link',
                class: 'e-py-0.5 e-px-2 e-text-[0.8125rem] e-leading-[1.75] e-rounded',
                size: 'sm',
            },
            {
                as: 'link',
                class: 'e-rounded-md',
                size: 'md',
            },
            {
                as: 'link',
                class: 'e-rounded-md',
                size: 'lg',
            },
        ],
        defaultVariants: {
            as: 'badge',
            size: 'xs',
            status: 'inactive',
            variant: 'default',
        },
        variants: {
            as: {
                badge: 'e-rounded',
                link: '/* no styles except compound variants */',
            },
            size: {
                lg: 'e-text-lg',
                md: 'e-text-md',
                sm: 'e-text-sm',
                xs: 'e-text-xs',
            },
            status: {
                active: 'e-shadow-active',
                inactive: '',
            },
            variant: {
                default:
                    'e-border-transparent e-text-neutral-900 [a&]:hover:e-bg-neutral-100/90 dark:e-text-neutral-50 dark:[a&]:hover:e-bg-neutral-800/90',
                destructive:
                    'e-border-transparent e-bg-red-500 e-text-white [a&]:hover:e-bg-red-500/90 focus-visible:e-ring-red-500/20 dark:focus-visible:e-ring-red-500/40 dark:e-bg-red-500/60 dark:e-bg-red-900 dark:[a&]:hover:e-bg-red-900/90 dark:focus-visible:e-ring-red-900/20 dark:focus-visible:e-ring-red-900/40 dark:e-bg-red-900/60',
                outline:
                    'e-text-neutral-950 [a&]:hover:e-bg-neutral-100 [a&]:hover:e-text-neutral-900 dark:e-text-neutral-50 dark:[a&]:hover:e-bg-neutral-800 dark:[a&]:hover:e-text-neutral-50',
                passive:
                    'e-border-transparent e-bg-neutral-900 e-text-neutral-50 [a&]:hover:e-bg-neutral-900/90 dark:e-bg-neutral-50 dark:e-text-neutral-900 dark:[a&]:hover:e-bg-neutral-50/90',
                secondary:
                    'e-border-transparent e-bg-neutral-100 e-text-neutral-900 [a&]:hover:e-bg-neutral-100/90 dark:e-bg-neutral-800 dark:e-text-neutral-50 dark:[a&]:hover:e-bg-neutral-800/90',
                transparent:
                    'e-border-transparent e-bg-transparent e-text-neutral-900 [a&]:hover:e-bg-neutral-100/90 dark:e-text-neutral-50 dark:[a&]:hover:e-bg-neutral-800/90',
            },
        },
    }
);

function Badge({
    className,
    as,
    size,
    status,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'span';

    return (
        <Comp data-slot="badge" className={cn(badgeVariants({ as, size, status, variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
