import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Tokens map to Dashkit-dark `.nav-tabs` + `.nav-link` (see app/scss/dashkit/_nav.scss): bottom-highlight tabs
// with `gray-600` idle / `white` active text and a `primary-on-dark` underline on the active tab.
const tabsListVariants = cva([
    'mb-0 flex flex-wrap',
    'border-0 border-b border-solid border-dk-gray-700-dark',
]);

const tabsTriggerVariants = cva(
    [
        'cursor-pointer bg-transparent',
        'mx-3 first:ml-0 last:mr-0',
        'mb-[-1px]', // mirrors Bootstrap `.nav-tabs .nav-link { margin-bottom: -1px }` so the active border overlaps the list border
        'border-0 border-b border-solid border-transparent',
        'px-0 py-4', // $nav-tabs-link-padding-y is 1rem ($card-cap-padding-y) so the tab bar matches card-header height
        'text-dk-gray-600 hover:text-dk-gray-700',
        'data-[active=true]:border-dk-primary-on-dark data-[active=true]:text-dk-white',
        'disabled:pointer-events-none disabled:opacity-50',
    ],
    {
        defaultVariants: { size: 'default' },
        variants: {
            size: {
                default: '',
                sm: 'text-sm mx-2 first:ml-0 last:mr-0',
            },
        },
    },
);

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => (
    <div ref={ref} role="tablist" className={cn(tabsListVariants(), className)} {...props} />
));
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof tabsTriggerVariants> {
    active?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ active, className, size, type, ...props }, ref) => (
        <button
            ref={ref}
            role="tab"
            type={type ?? 'button'}
            aria-selected={active === true}
            data-active={active ? 'true' : 'false'}
            className={cn(tabsTriggerVariants({ size }), className)}
            {...props}
        />
    ),
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
    ({ active, className, hidden, ...props }, ref) => (
        <div
            ref={ref}
            role="tabpanel"
            hidden={hidden ?? !active}
            data-active={active ? 'true' : 'false'}
            className={className}
            {...props}
        />
    ),
);
TabsContent.displayName = 'TabsContent';

export { TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
