import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            'e-peer e-inline-flex e-h-4 e-w-7 e-shrink-0 e-items-center',
            'e-rounded-full e-border-2 e-border-transparent e-shadow-sm',
            'e-cursor-pointer e-transition',
            'focus-visible:e-outline-none focus-visible:e-ring-2 focus-visible:e-ring-accent focus-visible:e-ring-offset-2 focus-visible:e-ring-offset-white',
            'disabled:e-cursor-not-allowed disabled:e-opacity-50',
            'data-[state=checked]:e-bg-accent data-[state=unchecked]:e-bg-neutral-300',
            className
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitives.Thumb
            className={cn(
                'e-pointer-events-none e-block e-h-3 e-w-3 e-rounded-full',
                'e-shrink-0 e-bg-white e-shadow-lg e-ring-0',
                'e-transition',
                'data-[state=checked]:e-translate-x-1 data-[state=unchecked]:-e-translate-x-1'
            )}
        />
    </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
