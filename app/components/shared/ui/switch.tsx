import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const rootVariants = [
    'e-peer e-inline-flex e-shrink-0 e-items-center',
    // e-p-0 kills the UA button padding (@tailwind base is skipped, so no global reset)
    'e-rounded-full e-border-2 e-border-transparent e-p-0 e-shadow-sm',
    'e-cursor-pointer e-transition',
    'focus-visible:e-outline-none focus-visible:e-ring-2 focus-visible:e-ring-accent focus-visible:e-ring-offset-2 focus-visible:e-ring-offset-white',
    'disabled:e-cursor-not-allowed disabled:e-opacity-50',
    'data-[state=checked]:e-bg-accent data-[state=unchecked]:e-bg-neutral-300',
];

const rootSizeVariants = {
    default: 'e-h-4 e-w-7',
    // lg mirrors the Bootstrap `.form-switch` footprint: 3rem x 1.5rem track, 18px thumb
    lg: 'e-h-6 e-w-12',
};

const thumbVariants = [
    'e-pointer-events-none e-block e-rounded-full',
    'e-shrink-0 e-bg-white e-shadow-lg e-ring-0',
    'e-transition',
];

// symmetric thumb inset on both ends: 2px at default size, 3px at lg
const thumbSizeVariants = {
    default: 'e-h-3 e-w-3 data-[state=checked]:e-translate-x-3 data-[state=unchecked]:e-translate-x-0',
    lg: 'e-h-[18px] e-w-[18px] data-[state=checked]:e-translate-x-[25px] data-[state=unchecked]:e-translate-x-[1px]',
};

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
    size?: keyof typeof rootSizeVariants;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
    ({ className, size = 'default', ...props }, ref) => (
        <SwitchPrimitives.Root className={cn(rootVariants, rootSizeVariants[size], className)} {...props} ref={ref}>
            <SwitchPrimitives.Thumb className={cn(thumbVariants, thumbSizeVariants[size])} />
        </SwitchPrimitives.Root>
    ),
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
