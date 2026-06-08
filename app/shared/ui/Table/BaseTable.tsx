import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// `ui` picks the visual lineage, mirroring BaseCard. `dashkit` emits the raw Bootstrap classes the
// rest of the app currently uses, so migrations don't change visuals; a future pass can replicate
// them via dk-* Tailwind tokens the way BaseCard does. `tw` is the long-term Tailwind/OKLCH styling.
//
// `variant="card"` mirrors the dashkit `.card-table` styling: zero thead border-top, first/last
// cell padding aligned with the card edges, and a `table-responsive` outer wrapper for horizontal
// overflow scrolling. Use inside a `<BaseCard ui="dashkit">` body.
//
// Compound API — children can be plain HTML (`<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`) or the
// matching `BaseTable.*` subcomponents. Both render byte-identical markup today; the subcomponents
// exist so consumers don't reference raw table elements directly, opening the door to a future
// non-`<table>` implementation (e.g. CSS grid) without changing call sites.
const tableVariants = cva([], {
    compoundVariants: [
        { class: 'table-nowrap', nowrap: true, ui: 'dashkit' },
        { class: '[&_th]:e-whitespace-nowrap [&_td]:e-whitespace-nowrap', nowrap: true, ui: 'tw' },
        // card variant adds dashkit `.card-table` on top of the base `table table-sm`.
        { class: 'card-table', ui: 'dashkit', variant: 'card' },
        // TW equivalent of `.card-table`: zero thead border-top + first/last cell padding to card edges + e-mb-0.
        {
            class: [
                'e-mb-0',
                '[&_thead_th]:e-border-t-0',
                '[&_thead_th:first-child]:e-pl-6 [&_thead_th:last-child]:e-pr-6',
                '[&_tbody_td:first-child]:e-pl-6 [&_tbody_td:last-child]:e-pr-6',
            ].join(' '),
            ui: 'tw',
            variant: 'card',
        },
    ],
    defaultVariants: { nowrap: false, ui: 'tw', variant: 'plain' },
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
        variant: { card: '', plain: '' },
    },
});

const wrapperVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit: 'table-responsive e-mb-0',
            tw: 'e-overflow-x-auto e-mb-0',
        },
    },
});

export interface BaseTableProps
    extends React.TableHTMLAttributes<HTMLTableElement>,
        VariantProps<typeof tableVariants> {}

const BaseTableRoot = React.forwardRef<HTMLTableElement, BaseTableProps>(
    ({ className, nowrap, ui, variant, ...props }, ref) => {
        const table = <table ref={ref} className={cn(tableVariants({ nowrap, ui, variant }), className)} {...props} />;
        if (variant === 'card') {
            return <div className={cn(wrapperVariants({ ui }))}>{table}</div>;
        }
        return table;
    },
);
BaseTableRoot.displayName = 'BaseTable';

// Compound subcomponents — plain HTML passthroughs today so visuals stay byte-identical and the
// parent BaseTable's `[&_thead_th]:...` selectors still apply via descendant matching. Swapping the
// implementation to a non-`<table>` layout (CSS grid, etc.) later only touches this file.
const Head = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
    <thead ref={ref} {...props} />
));
Head.displayName = 'BaseTable.Head';

const Body = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
    <tbody ref={ref} {...props} />
));
Body.displayName = 'BaseTable.Body';

const Foot = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
    <tfoot ref={ref} {...props} />
));
Foot.displayName = 'BaseTable.Foot';

const Row = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>((props, ref) => (
    <tr ref={ref} {...props} />
));
Row.displayName = 'BaseTable.Row';

const HeaderCell = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    (props, ref) => <th ref={ref} {...props} />,
);
HeaderCell.displayName = 'BaseTable.HeaderCell';

const Cell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>((props, ref) => (
    <td ref={ref} {...props} />
));
Cell.displayName = 'BaseTable.Cell';

const Caption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
    (props, ref) => <caption ref={ref} {...props} />,
);
Caption.displayName = 'BaseTable.Caption';

const BaseTable = Object.assign(BaseTableRoot, {
    Body,
    Caption,
    Cell,
    Foot,
    Head,
    HeaderCell,
    Row,
});

export { BaseTable, tableVariants as baseTableVariants };
