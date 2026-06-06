import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// TODO: replace with the Radix-backed implementation (see app/components/shared/ui/dropdown-menu.tsx)
// once the dashkit SCSS is retired — consumers keep the same import paths and identifiers.
//
// This file is the backported-from-dashkit Dropdown API. The current implementation emits the
// Bootstrap `.dropdown` / `.dropdown-menu` / `.dropdown-item` / `.dropdown-header` classes the rest
// of the app currently uses so toggles driven by Bootstrap's `data-bs-toggle="dropdown"` JS keep
// working unchanged. It exists as a thin shim so consumers can migrate AWAY from raw classNames
// before the underlying styling library swap, splitting the work into two reviewable phases.

const Dropdown = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('dropdown', className)} {...props} />,
);
Dropdown.displayName = 'Dropdown';

interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'end';
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
    ({ className, align = 'start', ...props }, ref) => (
        <div ref={ref} className={cn('dropdown-menu', align === 'end' && 'dropdown-menu-end', className)} {...props} />
    ),
);
DropdownMenu.displayName = 'DropdownMenu';

const DropdownHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('dropdown-header', className)} {...props} />,
);
DropdownHeader.displayName = 'DropdownHeader';

interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}

const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(
    ({ className, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'div';
        return <Comp ref={ref} className={cn('dropdown-item', className)} {...props} />;
    },
);
DropdownItem.displayName = 'DropdownItem';

export { Dropdown, DropdownHeader, DropdownItem, DropdownMenu };
