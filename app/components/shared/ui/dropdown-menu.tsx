import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as React from 'react';
import { Check, ChevronRight, Circle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
        inset?: boolean;
    }
>(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            'e-flex e-cursor-default e-select-none e-items-center e-gap-2 e-rounded-sm e-px-2 e-py-1.5 e-text-sm e-outline-none',
            'focus:e-bg-outer-space-800 data-[state=open]:e-bg-outer-space-800',
            '[&_svg]:e-pointer-events-none [&_svg]:e-size-4 [&_svg]:e-shrink-0',
            inset && 'e-pl-8',
            className
        )}
        {...props}
    >
        {children}
        <ChevronRight className="e-ml-auto" size={16} />
    </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={cn(
            'e-z-50 e-min-w-[8rem] e-overflow-hidden e-rounded-md e-p-1 e-shadow-lg',
            'e-border e-border-solid e-border-outer-space-800 e-bg-outer-space-900 e-text-outer-space-50',
            'data-[state=open]:e-animate-in data-[state=closed]:e-animate-out',
            'data-[state=closed]:e-fade-out-0 data-[state=open]:e-fade-in-0',
            'data-[state=closed]:e-zoom-out-95 data-[state=open]:e-zoom-in-95',
            'data-[side=bottom]:e-slide-in-from-top-2 data-[side=left]:e-slide-in-from-right-2',
            'data-[side=right]:e-slide-in-from-left-2 data-[side=top]:e-slide-in-from-bottom-2',
            className
        )}
        {...props}
    />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                'e-z-50 e-max-h-[var(--radix-dropdown-menu-content-available-height)] e-min-w-[8rem] e-overflow-y-auto e-overflow-x-hidden e-rounded-md e-p-1 e-shadow-md',
                'e-border e-border-solid e-border-outer-space-800 e-bg-outer-space-900 e-text-outer-space-50',
                'data-[state=open]:e-animate-in data-[state=closed]:e-animate-out',
                'data-[state=closed]:e-fade-out-0 data-[state=open]:e-fade-in-0',
                'data-[state=closed]:e-zoom-out-95 data-[state=open]:e-zoom-in-95',
                'data-[side=bottom]:e-slide-in-from-top-2 data-[side=left]:e-slide-in-from-right-2',
                'data-[side=right]:e-slide-in-from-left-2 data-[side=top]:e-slide-in-from-bottom-2',
                className
            )}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            'e-relative e-flex e-cursor-default e-select-none e-items-center e-gap-2 e-rounded-sm e-px-2 e-py-1.5 e-text-sm e-outline-none e-transition-colors',
            'focus:e-bg-outer-space-800 focus:e-text-outer-space-50',
            'data-[disabled]:e-pointer-events-none data-[disabled]:e-opacity-50',
            '[&>svg]:e-size-4 [&>svg]:e-shrink-0',
            inset && 'e-pl-8',
            className
        )}
        {...props}
    />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            'e-relative e-flex e-cursor-default e-select-none e-items-center e-rounded-sm e-py-1.5 e-pl-8 e-pr-2 e-text-sm e-outline-none e-transition-colors',
            'focus:e-bg-outer-space-800 focus:e-text-outer-space-50',
            'data-[disabled]:e-pointer-events-none data-[disabled]:e-opacity-50',
            className
        )}
        checked={checked}
        {...props}
    >
        <span className="e-absolute e-left-2 e-flex e-h-3.5 e-w-3.5 e-items-center e-justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Check size={16} />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
            'e-relative e-flex e-cursor-default e-select-none e-items-center e-rounded-sm e-py-1.5 e-pl-8 e-pr-2 e-text-sm e-outline-none e-transition-colors',
            'focus:e-bg-outer-space-800 focus:e-text-outer-space-50',
            'data-[disabled]:e-pointer-events-none data-[disabled]:e-opacity-50',
            className
        )}
        {...props}
    >
        <span className="e-absolute e-left-2 e-flex e-h-3.5 e-w-3.5 e-items-center e-justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Circle size={8} />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn('e-px-2 e-py-1.5 e-text-sm e-font-semibold', inset && 'e-pl-8', className)}
        {...props}
    />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
        ref={ref}
        className={cn('e--mx-1 e-my-1 e-h-px e-bg-outer-space-800', className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
    return <span className={cn('e-ml-auto e-text-xs e-tracking-widest e-opacity-60', className)} {...props} />;
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
};
