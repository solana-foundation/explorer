import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                'e-z-50 e-rounded-md e-bg-outer-space-900 e-shadow-[0_4px_12px_rgba(0,0,0,0.5)] e-outline-none',
                'e-border e-border-solid e-border-outer-space-800',
                'data-[state=open]:e-animate-in data-[state=closed]:e-animate-out',
                'data-[state=closed]:e-fade-out-0 data-[state=open]:e-fade-in-0',
                'data-[state=closed]:e-zoom-out-95 data-[state=open]:e-zoom-in-95',
                'data-[side=bottom]:e-slide-in-from-top-2 data-[side=left]:e-slide-in-from-right-2',
                'data-[side=right]:e-slide-in-from-left-2 data-[side=top]:e-slide-in-from-bottom-2',
                className
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
