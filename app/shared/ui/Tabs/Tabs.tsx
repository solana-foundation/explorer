import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Tokens map to Dashkit-dark `.nav-tabs` + `.nav-link` (see app/scss/dashkit/_nav.scss): bottom-highlight tabs
// with `gray-600` idle / `white` active text and a `primary-on-dark` underline on the active tab.
const tabsListVariants = cva([
    'e-mb-0 e-flex e-flex-wrap',
    'e-border-0 e-border-b e-border-solid e-border-dk-gray-700-dark',
]);

const tabsTriggerVariants = cva(
    [
        'e-cursor-pointer e-bg-transparent',
        'e-mx-3 first:e-ml-0 last:e-mr-0',
        'e-mb-[-1px]', // mirrors Bootstrap `.nav-tabs .nav-link { margin-bottom: -1px }` so the active border overlaps the list border
        'e-border-0 e-border-b e-border-solid e-border-transparent',
        'e-px-0 e-py-4', // $nav-tabs-link-padding-y is 1rem ($card-cap-padding-y) so the tab bar matches card-header height
        'e-text-dk-gray-600 hover:e-text-dk-gray-700',
        'data-[active=true]:e-border-dk-primary-on-dark data-[active=true]:e-text-dk-white',
        'disabled:e-pointer-events-none disabled:e-opacity-50',
    ],
    {
        defaultVariants: { size: 'default' },
        variants: {
            size: {
                default: '',
                sm: 'e-text-sm e-mx-2 first:e-ml-0 last:e-mr-0',
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
            aria-selected={active}
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
