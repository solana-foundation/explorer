import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const rootVariants = [
    'peer inline-flex shrink-0 items-center',
    // p-0 kills the UA button padding (@tailwind base is skipped, so no global reset)
    'rounded-full border-2 border-transparent p-0 shadow-sm',
    'cursor-pointer transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[state=checked]:bg-accent data-[state=unchecked]:bg-neutral-300',
];

const rootSizeVariants = {
    default: 'h-4 w-7',
    // lg mirrors the Bootstrap `.form-switch` footprint: 3rem x 1.5rem track, 18px thumb
    lg: 'h-6 w-12',
};

const thumbVariants = [
    'pointer-events-none block rounded-full',
    'shrink-0 bg-white shadow-lg ring-0',
    'transition',
];

// symmetric thumb inset on both ends: 2px at default size, 3px at lg
const thumbSizeVariants = {
    default: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
    lg: 'h-[18px] w-[18px] data-[state=checked]:translate-x-[25px] data-[state=unchecked]:translate-x-[1px]',
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
