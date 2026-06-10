import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// `dashkit` mirrors the Bootstrap `.form-switch` geometry: 3rem x 1.5rem track, 18px thumb inset 3px.
const rootVariants = {
    dashkit: [
        'e-peer e-inline-flex e-h-6 e-w-12 e-shrink-0 e-items-center',
        // e-p-0 kills the UA button padding (1px 6px) — @tailwind base is skipped, so no global reset
        'e-rounded-full e-border-0 e-p-0',
        'e-cursor-pointer e-transition-none',
        'focus-visible:e-outline-none focus-visible:e-ring-2 focus-visible:e-ring-accent focus-visible:e-ring-offset-2 focus-visible:e-ring-offset-white',
        'disabled:e-cursor-not-allowed disabled:e-opacity-50',
        'data-[state=checked]:e-bg-dk-primary-on-dark data-[state=unchecked]:e-bg-dk-gray-600-dark',
    ],
    default: [
        'e-peer e-inline-flex e-h-4 e-w-7 e-shrink-0 e-items-center',
        'e-rounded-full e-border-2 e-border-transparent e-shadow-sm',
        'e-cursor-pointer e-transition',
        'focus-visible:e-outline-none focus-visible:e-ring-2 focus-visible:e-ring-accent focus-visible:e-ring-offset-2 focus-visible:e-ring-offset-white',
        'disabled:e-cursor-not-allowed disabled:e-opacity-50',
        'data-[state=checked]:e-bg-accent data-[state=unchecked]:e-bg-neutral-300',
    ],
};

const thumbVariants = {
    dashkit: [
        'e-pointer-events-none e-block e-h-[18px] e-w-[18px] e-rounded-full',
        'e-shrink-0 e-ring-0',
        'e-transition-none',
        'data-[state=checked]:e-bg-white data-[state=unchecked]:e-bg-dk-gray-800-dark',
        'data-[state=checked]:e-translate-x-[27px] data-[state=unchecked]:e-translate-x-[3px]',
    ],
    default: [
        'e-pointer-events-none e-block e-h-3 e-w-3 e-rounded-full',
        'e-shrink-0 e-bg-white e-shadow-lg e-ring-0',
        'e-transition',
        'data-[state=checked]:e-translate-x-1 data-[state=unchecked]:-e-translate-x-1',
    ],
};

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
    ui?: keyof typeof rootVariants;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
    ({ className, ui = 'default', ...props }, ref) => (
        <SwitchPrimitives.Root className={cn(rootVariants[ui], className)} {...props} ref={ref}>
            <SwitchPrimitives.Thumb className={cn(thumbVariants[ui])} />
        </SwitchPrimitives.Root>
    ),
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
