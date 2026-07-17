// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../utils';

const inputVariants = cva(
    cn(
        'border-solid',
        'font-normal font-mono',
        'flex h-9 w-full rounded border',
        'px-4 py-2.5 text-xs',
        // Native date/time pickers render a dark calendar glyph that's invisible on
        // our dark input backgrounds; invert it so it matches the light input text.
        '[&::-webkit-calendar-picker-indicator]:invert',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid="true"]:!border-destructive aria-[invalid="true"]:focus-visible:ring-destructive',
    ),
    {
        defaultVariants: {
            variant: 'default',
        },
        variants: {
            variant: {
                dark: '[color-scheme:dark] border-outer-space-950 bg-heavy-metal-900 text-neutral-200 placeholder:text-neutral-400 focus-visible:ring-accent focus-visible:ring-offset-neutral-900',
                default:
                    'border-neutral-200 bg-transparent text-neutral-200 placeholder:text-neutral-300 focus-visible:ring-neutral-300 focus-visible:ring-offset-neutral-900',
            },
        },
    },
);

export interface InputProps extends React.ComponentProps<'input'>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant, ...props }, ref) => {
    return <input type={type} className={cn(inputVariants({ variant }), className)} ref={ref} {...props} />;
});
Input.displayName = 'Input';

export { Input, inputVariants };
