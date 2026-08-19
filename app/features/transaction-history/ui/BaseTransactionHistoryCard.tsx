'use client';

import { RefreshButton } from '@components/shared/ui/refresh-button';
import { type ReactNode } from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { cn } from '@/app/components/shared/utils';
import { Card, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

// Domain status → how the status badge renders it. The card owns this mapping so Badge's variant
// names ('warning' for a failed tx) never leak into the row's data model. Exported so the mobile
// drawer can label the same status without re-deriving the mapping.
export const STATUS_BADGE = {
    failed: { label: 'Failed', variant: 'warning' },
    success: { label: 'Success', variant: 'success' },
} as const;

export type TransactionStatus = keyof typeof STATUS_BADGE;

export type TransactionHistoryRowView = {
    signature: string;
    slot: number;
    blockTime: number | null | undefined;
    status: TransactionStatus;
};

export type BaseTransactionHistoryCardProps = {
    rows: TransactionHistoryRowView[];
    fetching: boolean;
    foundOldest: boolean;
    onRefresh: () => void;
    onLoadMore: () => void;
    /** Filter trigger (and any other header actions) rendered in the external header row. */
    headerActions?: ReactNode;
    /** Active-filter chips rendered under the header. */
    headerSubRow?: ReactNode;
    /** Per-row renderer — owns the row's lazy hooks (instruction summaries, raw data, drawer). */
    renderRow: (row: TransactionHistoryRowView, hasTimestamps: boolean) => ReactNode;
};

// Table styling + the table→card transformation, expressed as scoped arbitrary variants on the card
// wrapper (replaces the former transaction-history.css). Mobile-first: the base (unprefixed) classes
// build the MOBILE card layout — the thead is hidden and each row collapses into its own bordered,
// rounded, tappable card (which opens the details drawer). Only the first cell renders — it carries
// the full labelled card (Signature/Time/Block/Programs — see TransactionRow); the Time/Block/Size
// cells are hidden because their data is re-shown, captioned, inside that card. The `lg:` classes
// then REVERT everything back to a normal table on desktop (>= lg).
//
// NB: intentionally NOT `max-lg:` — this project overrides Tailwind's `screens` (tailwind.config.ts),
// which disables the auto-generated `max-*` variants, so a max-width approach silently compiles to
// nothing. Mobile-first base + `lg:` reverts is the reliable pattern here.
const TABLE_CLASSES = cn(
    // Shared by both layouts: top-aligned cells, comfortable line-height, 12px uppercase header.
    '[&_tbody_td]:align-top [&_tbody_td]:leading-6 [&_thead_th]:!text-xs',

    // ── Mobile (base): table → stack of cards.
    'overflow-x-clip [&_.overflow-x-auto]:overflow-x-clip',
    '[&_thead]:hidden [&_table]:block [&_tbody]:block [&_tr]:block',
    // Strip every cell's border — the row card owns the frame.
    '[&_tbody_td]:!border-0',
    // First cell becomes the full-width card body: fill the card (!w-auto), drop its padding (!p-0), wrap text.
    '[&_tbody_td:first-child]:block [&_tbody_td:first-child]:!w-auto [&_tbody_td:first-child]:whitespace-normal [&_tbody_td:first-child]:!p-0',
    '[&_tbody_td:not(:first-child)]:hidden',
    '[&_tbody_tr]:mb-2 [&_tbody_tr]:cursor-pointer [&_tbody_tr]:rounded-lg [&_tbody_tr]:border [&_tbody_tr]:border-solid [&_tbody_tr]:border-outer-space-800 [&_tbody_tr]:bg-[#1e2423] [&_tbody_tr]:px-3 [&_tbody_tr]:py-2',
    '[&_tbody_tr:last-child]:mb-0',

    // ── Desktop (lg+): revert the card transformation back to a normal table.
    'lg:overflow-x-visible lg:[&_.overflow-x-auto]:overflow-x-auto',
    'lg:[&_thead]:table-header-group lg:[&_table]:table lg:[&_tbody]:table-row-group lg:[&_tr]:table-row',
    // Restore the cell top-border (BaseTable's border-style/color survive — !border-0 only zeroed the width).
    'lg:[&_tbody_td]:!border-t',
    // First cell back to a normal table cell with BaseTable's subtle padding (px-3 py-2.5).
    'lg:[&_tbody_td:first-child]:table-cell lg:[&_tbody_td:first-child]:whitespace-nowrap lg:[&_tbody_td:first-child]:!px-3 lg:[&_tbody_td:first-child]:!py-2.5',
    'lg:[&_tbody_td:not(:first-child)]:table-cell',
    // Undo the row-card chrome (padding on a table-row is ignored, so no need to reset px/py).
    'lg:[&_tbody_tr]:mb-0 lg:[&_tbody_tr]:cursor-auto lg:[&_tbody_tr]:rounded-none lg:[&_tbody_tr]:border-0 lg:[&_tbody_tr]:bg-transparent',
);

export function BaseTransactionHistoryCard({
    rows,
    fetching,
    foundOldest,
    onRefresh,
    onLoadMore,
    headerActions,
    headerSubRow,
    renderRow,
}: BaseTransactionHistoryCardProps) {
    const hasTimestamps = rows.some(row => row.blockTime);
    // No rows → an empty account whose history is fully fetched. Hide the table header
    // (nothing to label) and give the footer message room to breathe.
    const isEmpty = rows.length === 0;

    return (
        <div className={TABLE_CLASSES}>
            {/* Title rendered OUTSIDE/above the card, with the refresh button + filter trigger
                in the same row and the active-filter chips beneath it. min-h matches the tab cards'
                external header so the gap to the card lines up across tabs. */}
            <div className="mb-3 flex min-h-[1.75rem] items-center gap-2">
                <CardTitle as="h3" ui="dashkit" className="flex-1">
                    Transaction History
                </CardTitle>
                {headerActions}
                <RefreshButton analyticsSection="transaction_history_header" onClick={onRefresh} fetching={fetching} />
            </div>
            {headerSubRow && <div className="mb-3 flex flex-wrap gap-2">{headerSubRow}</div>}

            {/* On mobile each row becomes its own bordered card, so strip the outer Card's
                border/background/shadow (base) to avoid a doubled border around the row cards, then
                restore dashkit's card chrome on desktop (>= lg) where it wraps the real table. */}
            <Card
                ui="dashkit"
                marginBottom="none"
                className="!border-0 !bg-transparent !shadow-none lg:!border lg:!bg-dk-gray-800-dark lg:!shadow-dk-card"
            >
                <BaseTable ui="dashkit" variant="card" head="subtle" body="subtle" nowrap>
                    {!isEmpty && (
                        <BaseTable.Head>
                            <BaseTable.Row>
                                <BaseTable.HeaderCell>Transaction Signature</BaseTable.HeaderCell>
                                {hasTimestamps && (
                                    <BaseTable.HeaderCell className="w-[26%] min-w-[190px]">Time</BaseTable.HeaderCell>
                                )}
                                <BaseTable.HeaderCell className="w-[19%] min-w-[150px]">Block</BaseTable.HeaderCell>
                                <BaseTable.HeaderCell className="w-[16%] min-w-[120px]">
                                    Size (bytes)
                                </BaseTable.HeaderCell>
                            </BaseTable.Row>
                        </BaseTable.Head>
                    )}
                    <BaseTable.Body>{rows.map(row => renderRow(row, hasTimestamps))}</BaseTable.Body>
                </BaseTable>
                <div
                    className={cn(
                        // Mobile: no outer card frame, so no top divider and no horizontal padding.
                        // Desktop: the footer sits inside the card, so add the top divider + padding.
                        'border-0 border-solid border-dark-border px-0 py-3 lg:px-3',
                        !isEmpty && 'lg:border-t',
                        isEmpty && 'py-12',
                    )}
                >
                    {foundOldest ? (
                        <div className="text-center text-dk-gray-700">Fetched full history</div>
                    ) : (
                        <Button
                            ui="dashkit"
                            variant="primary"
                            className="w-full"
                            onClick={() => onLoadMore()}
                            disabled={fetching}
                        >
                            {fetching ? (
                                <>
                                    <span className="spinner-grow spinner-grow-sm mr-1.5 align-text-top"></span>
                                    Loading
                                </>
                            ) : (
                                'Load More'
                            )}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
