import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const formControlVariants = cva(['e-block', 'e-w-full', 'e-bg-transparent', 'e-text-inherit'], {
    defaultVariants: { variant: 'default' },
    variants: {
        variant: {
            // Bootstrap .form-control baseline equivalent: bordered, padded, rounded.
            // No focus chrome to match production (Bootstrap's .form-control:focus set `outline: 0`).
            default:
                'e-rounded-lg e-border e-border-solid e-border-dk-card-outline-dark e-px-3 e-py-2 focus:e-outline-none focus-visible:e-outline-none',
            // .form-control-flush: no border, no horizontal padding, no focus chrome.
            flush: 'e-resize-none e-border-0 e-px-0 e-py-2 focus:e-outline-none focus-visible:e-outline-none',
            // .form-control-flush + .form-control-auto: no border, no padding, auto height, no focus chrome.
            'flush-auto': 'e-min-h-0 e-resize-none e-border-0 e-p-0 focus:e-outline-none focus-visible:e-outline-none',
        },
    },
});

export interface FormControlProps extends VariantProps<typeof formControlVariants>, React.HTMLAttributes<HTMLElement> {
    children: React.ReactElement;
}

/**
 * Slot-style styling wrapper for form elements. Renders its single child element (input / textarea /
 * select) with form-control classes composed in. Uses Radix Slot for ref + event composition.
 *
 * Usage:
 *   <FormControl variant="flush-auto" className="e-font-mono">
 *     <textarea rows={3} placeholder="..." />
 *   </FormControl>
 */
const FormControl = React.forwardRef<HTMLElement, FormControlProps>(
    ({ children, className, variant, ...props }, ref) => (
        <Slot ref={ref} className={cn(formControlVariants({ variant }), className)} {...props}>
            {children}
        </Slot>
    ),
);
FormControl.displayName = 'FormControl';

export { FormControl, formControlVariants };
