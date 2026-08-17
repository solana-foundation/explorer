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

// Table styling + the mobile table→card transformation, expressed as scoped arbitrary variants on
// the card wrapper (replaces the former transaction-history.css). Desktop: top-aligned cells, a
// 12px uppercase caption header. Mobile (< md): the thead is hidden and each row collapses into its
// own bordered, rounded, tappable card (which opens the details drawer).
const TABLE_CLASSES = cn(
    // Desktop table
    '[&_tbody_td]:align-top [&_tbody_td]:leading-6 [&_thead_th]:!text-xs',
    // Mobile (< md): stack rows into cards. `lt-md` is a true max-width screen (see tailwind.config).
    'lt-md:overflow-x-clip lt-md:[&_.overflow-x-auto]:overflow-x-clip',
    'lt-md:[&_thead]:hidden lt-md:[&_table]:block lt-md:[&_tbody]:block lt-md:[&_tr]:block',
    // !w-auto overrides the desktop `w-px` (shrink-to-content) on the Time/Block/Size cells —
    // once they're display:block, width:1px would collapse them and break their text per-character.
    'lt-md:[&_tbody_td]:block lt-md:[&_tbody_td]:!w-auto lt-md:[&_tbody_td]:whitespace-normal lt-md:[&_tbody_td]:!border-0 lt-md:[&_tbody_td]:!px-0 lt-md:[&_tbody_td]:!py-0.5',
    'lt-md:[&_tbody_tr]:mb-2 lt-md:[&_tbody_tr]:cursor-pointer lt-md:[&_tbody_tr]:rounded-lg lt-md:[&_tbody_tr]:border lt-md:[&_tbody_tr]:border-solid lt-md:[&_tbody_tr]:border-outer-space-800 lt-md:[&_tbody_tr]:bg-[#1e2423] lt-md:[&_tbody_tr]:px-3 lt-md:[&_tbody_tr]:py-2',
    'lt-md:[&_tbody_tr:last-child]:mb-0',
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
                border/background/shadow to avoid a doubled border around the row cards. */}
            <Card ui="dashkit" marginBottom="none" className="lt-md:!border-0 lt-md:!bg-transparent lt-md:!shadow-none">
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
                        // Divider above the footer, dropped on mobile where there's no outer card frame.
                        'border-0 border-t border-solid border-dark-border p-3 lt-md:border-t-0 lt-md:px-0',
                        isEmpty && 'border-t-0 py-12',
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
