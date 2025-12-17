import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const buttonVariants = cva(
    cn(
        'e-border-solid',
        'e-inline-flex e-items-center e-justify-center e-gap-2',
        'e-whitespace-nowrap e-rounded e-text-sm e-font-medium',
        'e-transition-colors',
        'focus-visible:e-outline-none focus-visible:e-ring-2 focus-visible:e-ring-offset-2 focus-visible:e-ring-neutral-950',
        'disabled:e-pointer-events-none disabled:e-opacity-50',
        '[&_svg]:e-pointer-events-none [&_svg]:e-size-3 [&_svg]:e-shrink-0'
    ),
    {
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
        variants: {
            size: {
                default: 'e-h-9 e-px-2 e-text-xs',
                icon: 'e-h-9 e-w-9',
                lg: 'e-h-10 e-px-8',
                sm: 'e-h-7 e-px-2 e-text-xs',
            },
            variant: {
                accent: 'e-border-0 e-bg-accent e-text-gray-900 hover:e-bg-accent/90',
                default: 'e-bg-neutral-900 e-text-neutral-50 e-shadow hover:e-bg-neutral-900/90',
                destructive: 'e-bg-red-500 e-text-neutral-50 e-shadow-sm hover:e-bg-red-500/90',
                ghost: 'hover:e-bg-neutral-100 hover:e-text-neutral-900',
                link: 'e-text-neutral-900 e-underline-offset-4 hover:e-underline',
                outline:
                    'e-border e-border-neutral-600 e-bg-transparent e-text-white hover:e-bg-neutral-600/10 focus-visible:e-ring-1 focus-visible:e-ring-offset-1 focus-visible:e-ring-neutral-950',
                secondary: 'e-bg-neutral-100 e-text-neutral-900 e-shadow-sm hover:e-bg-neutral-100/80',
            },
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />;
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
