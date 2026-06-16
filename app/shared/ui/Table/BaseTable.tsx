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
        { class: '[&_th]:whitespace-nowrap [&_td]:whitespace-nowrap', nowrap: true },
        // Plain dashkit table — .table{margin-bottom:$spacer} with dashkit $spacer = 1.5rem (24px).
        { class: 'mb-6', ui: 'dashkit', variant: 'plain' },
        // TW equivalent of `.card-table`: zero thead border-top + first/last cell padding to card edges + mb-0.
        // First/last cell padding-x is 1.5rem — compiled dashkit pins `padding-left/right: 1.5rem !important`
        // on `.card-table` edge cells (verified against the compiled dashkit bundle + live p4 pixels).
        {
            class: [
                'mb-0',
                '[&_thead_th]:border-t-0',
                '[&_thead_th:first-child]:pl-6 [&_thead_th:last-child]:pr-6',
                '[&_tbody_td:first-child]:pl-6 [&_tbody_td:last-child]:pr-6',
            ].join(' '),
            variant: 'card',
        },
    ],
    defaultVariants: { nowrap: false, ui: 'tw', variant: 'plain' },
    variants: {
        nowrap: { false: '', true: '' },
        ui: {
            // Tailwind translation of compiled `.table.table-sm`; keeps the Dashkit `1.5rem` table margin and the `#1e2423` tbody border that the SCSS late-override pins.
            dashkit: [
                // mb-* intentionally omitted — per-variant compounds own bottom margin so the
                // card variant's mb-0 isn't beaten by a base mb-6 in CSS source order
                // (twMerge can't dedupe through the e- prefix).
                'w-full text-dk-sm text-white',
                '[&_thead_th]:bg-dark-background [&_thead_th]:uppercase [&_thead_th]:text-dk-xs',
                '[&_thead_th]:font-normal [&_thead_th]:tracking-[0.08em] [&_thead_th]:text-dark-muted-foreground',
                '[&_thead_th]:text-left [&_th]:align-middle [&_td]:align-middle',
                '[&_th]:p-4 [&_td]:p-4',
                '[&_thead_th]:border-t [&_thead_th]:border-solid [&_thead_th]:border-[#282d2b]',
                // tbody row separator visible against #1e2423 card bg — matches dashkit $card-border-color (#282d2b) on dark.
                '[&_tbody_td]:border-t [&_tbody_td]:border-solid [&_tbody_td]:border-[#282d2b]',
            ].join(' '),
            // Mirrors compiled `.table.table-sm` (Bootstrap 5 + dashkit overrides).
            tw: [
                'w-full text-dk-sm text-white',
                '[&_thead_th]:bg-dark-background [&_thead_th]:uppercase [&_thead_th]:text-dk-xs',
                '[&_thead_th]:font-normal [&_thead_th]:tracking-[0.08em] [&_thead_th]:text-dark-muted-foreground',
                '[&_thead_th]:text-left [&_th]:align-middle [&_td]:align-middle',
                '[&_th]:p-4 [&_td]:p-4',
                '[&_thead_th]:border-b [&_thead_th]:border-dk-gray-700-dark',
                '[&_tbody_td]:border-b [&_tbody_td]:border-dk-gray-700-dark',
                '[&_tbody_tr:last-child_td]:border-b-0',
            ].join(' '),
        },
        variant: { card: '', plain: '' },
    },
});

const wrapperVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit: 'overflow-x-auto mb-0',
            tw: 'overflow-x-auto mb-0',
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
