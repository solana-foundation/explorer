import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// `ui` picks the visual lineage, mirroring BaseCard. `dashkit` emits the raw Bootstrap classes the rest
// of the app currently uses, so migrations don't change visuals; a future pass can replicate them via
// dk-* Tailwind tokens the way BaseCard does. `tw` is the long-term Tailwind/OKLCH styling.
const tableVariants = cva([], {
    compoundVariants: [
        { class: 'table-nowrap', nowrap: true, ui: 'dashkit' },
        { class: '[&_th]:e-whitespace-nowrap [&_td]:e-whitespace-nowrap', nowrap: true, ui: 'tw' },
    ],
    defaultVariants: { nowrap: false, ui: 'tw' },
    variants: {
        nowrap: { false: '', true: '' },
        ui: {
            dashkit: 'table table-sm',
            // Mirrors `.table.table-sm` as compiled in .storybook/layout.min.css (Bootstrap 5 + dashkit overrides).
            tw: [
                'e-w-full e-text-dk-sm e-text-white',
                '[&_thead_th]:e-bg-dark-background [&_thead_th]:e-uppercase [&_thead_th]:e-text-dk-xs',
                '[&_thead_th]:e-font-normal [&_thead_th]:e-tracking-[0.08em] [&_thead_th]:e-text-dark-muted-foreground',
                '[&_thead_th]:e-text-left [&_th]:e-align-middle [&_td]:e-align-middle',
                '[&_th]:e-p-4 [&_td]:e-p-4',
                '[&_thead_th]:e-border-b [&_thead_th]:e-border-dk-gray-700-dark',
                '[&_tbody_td]:e-border-b [&_tbody_td]:e-border-dk-gray-700-dark',
                '[&_tbody_tr:last-child_td]:e-border-b-0',
            ].join(' '),
        },
    },
});

export interface BaseTableProps
    extends React.TableHTMLAttributes<HTMLTableElement>,
        VariantProps<typeof tableVariants> {}

const BaseTable = React.forwardRef<HTMLTableElement, BaseTableProps>(({ className, nowrap, ui, ...props }, ref) => (
    <table ref={ref} className={cn(tableVariants({ nowrap, ui }), className)} {...props} />
));
BaseTable.displayName = 'BaseTable';

export { BaseTable, tableVariants as baseTableVariants };
