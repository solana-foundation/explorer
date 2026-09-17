'use client';

import { createContext, forwardRef, type ReactNode, useContext } from 'react';

import { CollapsibleSection } from '@/app/components/shared/ui/collapsible-section';
import { cn } from '@/app/components/shared/utils';

// Shared responsive "list card": a framed table on desktop that becomes a stack of per-item cards on
// mobile. `DataListCard` owns the outer frame, `DataListRow` owns each row's chrome; the inner row
// layout (grid / flex / KeyValue) stays with the caller. Breakpoint is a prop (both variants ship as
// static strings) because Tailwind's JIT can't interpolate `${bp}:` — `lg` for address/tx/inspector,
// `md` for the block grids.
export type ListBreakpoint = 'md' | 'lg';

// No surface on mobile (the rows are their own cards), a dashkit card at/above the breakpoint. Section
// spacing is owned by the page layout, so no margin here — a caller that needs one passes `className`.
const SECTION_FRAME: Record<ListBreakpoint, string> = {
    lg: 'overflow-hidden rounded-lg border-0 bg-transparent lg:border lg:border-solid lg:border-outer-space-800 lg:bg-dk-gray-800-dark lg:shadow-dk-card',
    md: 'overflow-hidden rounded-lg border-0 bg-transparent md:border md:border-solid md:border-outer-space-800 md:bg-dk-gray-800-dark md:shadow-dk-card',
};

// A standalone card on mobile, reverting to a borderless bottom-divider row at/above the breakpoint.
// Content padding stays with the caller (layouts differ per page).
const ROW_CHROME: Record<ListBreakpoint, string> = {
    lg: 'mb-2 rounded-lg border border-solid border-outer-space-800 bg-dk-gray-800-dark last:mb-0 lg:mb-0 lg:rounded-none lg:border-0 lg:border-b lg:border-solid lg:border-white/10 lg:bg-transparent lg:last:border-b-0',
    md: 'mb-2 rounded-lg border border-solid border-outer-space-800 bg-dk-gray-800-dark last:mb-0 md:mb-0 md:rounded-none md:border-0 md:border-b md:border-solid md:border-white/10 md:bg-transparent md:last:border-b-0',
};

const BreakpointContext = createContext<ListBreakpoint>('lg');

export function DataListCard({
    id,
    title,
    actions,
    belowTitle,
    collapsible = true,
    defaultExpanded,
    breakpoint = 'lg',
    header,
    footer,
    className,
    titleClassName,
    sectionClassName,
    children,
}: {
    id?: string;
    title: ReactNode;
    actions?: ReactNode;
    belowTitle?: ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    breakpoint?: ListBreakpoint;
    /** Desktop column-header row, rendered above the rows (caller sets its own `hidden <bp>:grid`). */
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
    titleClassName?: string;
    sectionClassName?: string;
    children: ReactNode;
}) {
    return (
        <BreakpointContext.Provider value={breakpoint}>
            <CollapsibleSection
                id={id}
                title={title}
                actions={actions}
                belowTitle={belowTitle}
                collapsible={collapsible}
                defaultExpanded={defaultExpanded}
                className={cn(SECTION_FRAME[breakpoint], className)}
                titleClassName={titleClassName}
                sectionClassName={sectionClassName}
            >
                {header}
                {children}
                {footer}
            </CollapsibleSection>
        </BreakpointContext.Provider>
    );
}

export const DataListRow = forwardRef<
    HTMLDivElement,
    { className?: string; onClick?: React.MouseEventHandler<HTMLDivElement>; children: ReactNode }
>(function DataListRow({ className, onClick, children }, ref) {
    const breakpoint = useContext(BreakpointContext);
    return (
        <div ref={ref} onClick={onClick} className={cn(ROW_CHROME[breakpoint], className)}>
            {children}
        </div>
    );
});
