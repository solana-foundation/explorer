import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Tokens mirror Dashkit-dark `.navbar-nav` / `.nav-item` / `.nav-link` computed styles
// (color #698582 = dk-gray-700, 15px = dk-base, padding 10px 8px, no underline).
const navbarListVariants = cva(['e-m-0 e-flex e-list-none e-p-0']);

const navbarItemVariants = cva(['']);

const navbarLinkVariants = cva([
    'e-block e-px-2 e-py-2.5 e-text-dk-gray-700 hover:e-text-dk-white e-no-underline',
    'data-[active=true]:e-text-dk-white',
]);

export interface NavbarListProps extends React.HTMLAttributes<HTMLUListElement> {}

const NavbarList = React.forwardRef<HTMLUListElement, NavbarListProps>(({ className, ...props }, ref) => (
    <ul ref={ref} className={cn(navbarListVariants(), className)} {...props} />
));
NavbarList.displayName = 'NavbarList';

export interface NavbarItemProps extends React.LiHTMLAttributes<HTMLLIElement> {}

const NavbarItem = React.forwardRef<HTMLLIElement, NavbarItemProps>(({ className, ...props }, ref) => (
    <li ref={ref} className={cn(navbarItemVariants(), className)} {...props} />
));
NavbarItem.displayName = 'NavbarItem';

export interface NavbarLinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
        VariantProps<typeof navbarLinkVariants> {
    active?: boolean;
    /** Render styles onto the child element (e.g., Next.js `<Link>`) via Radix Slot. */
    asChild?: boolean;
}

const NavbarLink = React.forwardRef<HTMLAnchorElement, NavbarLinkProps>(
    ({ active, asChild, className, ...props }, ref) => {
        const Comp = asChild ? Slot : 'a';
        return (
            <Comp
                ref={ref}
                aria-current={active ? 'page' : undefined}
                data-active={active ? 'true' : 'false'}
                className={cn(navbarLinkVariants(), className)}
                {...props}
            />
        );
    },
);
NavbarLink.displayName = 'NavbarLink';

export { NavbarList, NavbarItem, NavbarLink, navbarListVariants, navbarItemVariants, navbarLinkVariants };
