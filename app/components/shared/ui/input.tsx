import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../utils';

const inputVariants = cva(
    cn(
        'e-border-solid',
        'e-font-normal e-font-mono',
        'e-flex e-h-9 e-w-full e-rounded e-border',
        'e-px-4 e-py-2.5 e-text-xs',
        'focus-visible:e-outline-none focus-visible:e-ring-2 focus-visible:e-ring-offset-2 focus-visible:e-ring-offset-neutral-900',
        'disabled:e-cursor-not-allowed disabled:e-opacity-50',
        'aria-[invalid="true"]:!e-border-destructive aria-[invalid="true"]:focus-visible:e-ring-destructive'
    ),
    {
        defaultVariants: {
            variant: 'default',
        },
        variants: {
            variant: {
                dark: 'e-border-outer-space-950 e-bg-heavy-metal-900 e-text-neutral-200 placeholder:e-text-neutral-400 focus-visible:e-ring-neutral-300 focus-visible:e-ring-offset-neutral-900',
                default:
                    'e-border-neutral-200 e-bg-transparent e-text-neutral-200 placeholder:e-text-neutral-300 focus-visible:e-ring-neutral-300 focus-visible:e-ring-offset-neutral-900',
            },
        },
    }
);

export interface InputProps extends React.ComponentProps<'input'>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant, ...props }, ref) => {
    return <input type={type} className={cn(inputVariants({ variant }), className)} ref={ref} {...props} />;
});
Input.displayName = 'Input';

export { Input, inputVariants };
