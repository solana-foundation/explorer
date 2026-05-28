import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => (
        <div className="e-relative e-w-full e-overflow-auto">
            <table
                ref={ref}
                className={cn(
                    'e-w-full e-caption-bottom e-bg-dk-gray-800-dark e-text-dk-sm e-text-dk-white',
                    className,
                )}
                {...props}
            />
        </div>
    ),
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <thead
            ref={ref}
            className={cn('e-bg-dk-black-dark [&_tr]:e-border-b [&_tr]:e-border-dk-gray-700-dark', className)}
            {...props}
        />
    ),
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tbody ref={ref} className={cn('[&_tr:last-child]:e-border-0', className)} {...props} />
    ),
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tfoot
            ref={ref}
            className={cn(
                'e-border-t e-border-dk-gray-700-dark e-bg-dk-black-dark e-font-medium [&>tr]:last:e-border-b-0',
                className,
            )}
            {...props}
        />
    ),
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                'e-border-b e-border-dk-gray-700-dark data-[state=selected]:e-bg-dk-gray-900-dark',
                className,
            )}
            {...props}
        />
    ),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn(
                'e-px-4 e-py-4 e-text-left e-align-middle',
                'e-text-dk-xs e-font-normal e-uppercase e-tracking-[0.08em] e-text-dk-gray-700',
                className,
            )}
            {...props}
        />
    ),
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <td ref={ref} className={cn('e-px-4 e-py-4 e-align-middle e-text-dk-white', className)} {...props} />
    ),
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
    ({ className, ...props }, ref) => (
        <caption ref={ref} className={cn('e-mt-4 e-text-dk-sm e-text-dk-gray-700', className)} {...props} />
    ),
);
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
