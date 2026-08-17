'use client';

import {
    HistoryFilterChips,
    HistoryFilterTrigger,
    useClearHistoryFilters,
    useHistoryFilters,
} from '@components/account/history/HistoryFilterBar';
import { getTransactionRows } from '@components/account/HistoryCardComponents';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { Badge } from '@components/shared/ui/badge';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFetchRawTransaction, useRawTransactionDetails } from '@/app/providers/transactions/raw';
import { useVisibility } from '@/app/shared/lib/visibility';
import { RelativeTime } from '@/app/shared/RelativeTime';
import { BaseTable } from '@/app/shared/ui/Table';

import { isGtfaDisabled } from '../lib/gtfa-disabled-addresses';
import { useAccountHistory, useHistoryFiltersSupported, useResetAccountHistory } from '../model/use-account-history';
import { useFetchAccountHistory } from '../model/use-fetch-account-history';
import { useResolvedInstructionSummaries } from '../model/use-resolved-instruction-summaries';
import { AccountSizeField } from './AccountSizeField';
import { BaseTransactionHistoryCard, STATUS_BADGE, type TransactionHistoryRowView } from './BaseTransactionHistoryCard';
import { InstructionList, InstructionListSkeleton } from './InstructionList';
import { TransactionDetailsDrawer } from './TransactionDetailsDrawer';

// Tracks whether the viewport matches `(max-width: 767.98px)`. Gates the mobile-only
// TransactionDetailsDrawer so desktop row clicks don't pop the drawer open.
function useIsMobileViewport(): boolean {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 767.98px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);
    return isMobile;
}

export function TransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const filters = useHistoryFilters();
    const hasActiveFilters = Object.values(filters).some(value => value !== undefined);
    const filtersKey = JSON.stringify(filters);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory(25, filters);
    const resetHistory = useResetAccountHistory();
    // Filtering needs gTFA. It's unavailable when the endpoint doesn't implement gTFA at all
    // (endpoint-wide flag) or when gTFA is temporarily disabled for this specific address (which
    // falls back to getSignaturesForAddress and can't honour filters). Both must drop active
    // filters, otherwise the URL params survive and misleading chips render beside unfiltered rows.
    const filtersSupported = useHistoryFiltersSupported() && !isGtfaDisabled(address);
    const clearFilters = useClearHistoryFilters();

    // Signatures only — the parsed transactions for instruction names / raw bytes are fetched lazily
    // per row, one at a time, so the page never batch-hammers the RPC into 429s.
    const refresh = useCallback(() => fetchAccountHistory(pubkey, false, true), [fetchAccountHistory, pubkey]);
    const loadMore = useCallback(() => fetchAccountHistory(pubkey, false), [fetchAccountHistory, pubkey]);

    const rows: TransactionHistoryRowView[] = history?.data?.fetched
        ? getTransactionRows(history.data.fetched).map(row => ({
              blockTime: row.blockTime,
              signature: row.signature,
              slot: row.slot,
              status: row.err ? 'failed' : 'success',
          }))
        : [];

    useEffect(() => {
        if (!history) {
            refresh();
        }
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    // Refetch from scratch when any filter changes. The cache is keyed by address
    // only, so we reset this address's entry (which also supersedes any in-flight
    // request for it) before refetching to avoid mixing pre- and post-filter results
    // in combineFetched.
    const previousFiltersKey = useRef(filtersKey);
    useEffect(() => {
        if (previousFiltersKey.current !== filtersKey) {
            previousFiltersKey.current = filtersKey;
            resetHistory(address);
            refresh();
        }
    }, [filtersKey, address, resetHistory, refresh]);

    // If the endpoint turns out not to support filtering, drop any active filters so the
    // (unfiltered) results aren't shown alongside misleading filter chips.
    useEffect(() => {
        if (!filtersSupported && hasActiveFilters) {
            clearFilters();
        }
    }, [filtersSupported, hasActiveFilters, clearFilters]);

    if (!history?.data) {
        return !history || history.status === FetchStatus.Fetching ? (
            <LoadingCard message="Loading history" />
        ) : (
            <ErrorCard retry={refresh} text="Failed to fetch transaction history" />
        );
    }

    return (
        <BaseTransactionHistoryCard
            rows={rows}
            fetching={history.status === FetchStatus.Fetching}
            foundOldest={history.data.foundOldest}
            onRefresh={refresh}
            onLoadMore={loadMore}
            headerActions={<HistoryFilterTrigger address={address} {...filters} />}
            headerSubRow={hasActiveFilters ? <HistoryFilterChips {...filters} /> : undefined}
            renderRow={(row, hasTimestamps) => (
                <TransactionRow key={row.signature} row={row} hasTimestamps={hasTimestamps} />
            )}
        />
    );
}

function TransactionRow({ row, hasTimestamps }: { row: TransactionHistoryRowView; hasTimestamps: boolean }) {
    const { signature, slot, blockTime, status } = row;
    const { isVisible, ref } = useVisibility<HTMLTableRowElement>(true);
    // Per-instruction summaries (program + resolved instruction name) for this signature; the fetch is
    // gated on row visibility. Returns undefined while loading, [] once fetched with nothing to show.
    const instructionNames = useResolvedInstructionSummaries(signature, isVisible);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isMobile = useIsMobileViewport();
    const badge = STATUS_BADGE[status];

    const programsBlock =
        instructionNames !== undefined && instructionNames.length > 0 ? (
            <InstructionList instructions={instructionNames} />
        ) : instructionNames === undefined ? (
            <InstructionListSkeleton />
        ) : (
            <span className="text-outer-space-300">---</span>
        );

    const handleRowClick = (e: React.MouseEvent) => {
        // Skip the drawer when the user actually clicked a real link/button in the row.
        if (e.target instanceof HTMLElement && e.target.closest('a, button')) return;
        if (isMobile) setDrawerOpen(true);
    };

    return (
        <>
            <BaseTable.Row ref={ref} onClick={isMobile ? handleRowClick : undefined}>
                <BaseTable.Cell>
                    <div>
                        <div className="flex min-w-0 items-start gap-2">
                            {/* The signature is always a real link: tapping it navigates (the row's
                                click handler skips the drawer for taps on `a`/`button`), while
                                tapping elsewhere on the card opens the drawer. */}
                            <span className="min-w-0">
                                <Signature signature={signature} link />
                            </span>
                            {/* top-1 drops the badge 4px so it sits lower against the signature,
                                without affecting row height. */}
                            <Badge ui="dashkit" tone="soft" variant={badge.variant} className="relative top-1">
                                {badge.label}
                            </Badge>
                        </div>
                        {/* Programs always stacked under the signature (no separate Programs column). */}
                        <div className="mt-1">{programsBlock}</div>
                    </div>
                </BaseTable.Cell>

                {hasTimestamps && (
                    <BaseTable.Cell className="w-px text-outer-space-300">
                        {blockTime ? (
                            // Two-line stack: absolute UTC timestamp on top, relative age beneath.
                            // On mobile the relative line is hidden (the drawer carries the full detail).
                            <div className="flex flex-col">
                                <span className="text-sm">{displayTimestampUtc(blockTime * 1000, true)}</span>
                                <span className="text-sm lt-md:hidden">
                                    <RelativeTime date={blockTime * 1000} />
                                </span>
                            </div>
                        ) : (
                            '---'
                        )}
                    </BaseTable.Cell>
                )}

                <BaseTable.Cell className="w-px">
                    {/* Block link is dropped on mobile — Slot renders plain text (no copy, no link). */}
                    <Slot slot={slot} link={!isMobile} />
                </BaseTable.Cell>

                {/* Size (bytes) is hidden on mobile — the drawer carries its own size row
                    plus the raw-data view. */}
                {!isMobile && (
                    <BaseTable.Cell className="w-px">
                        <TransactionRawDataSize signature={signature} />
                    </BaseTable.Cell>
                )}
            </BaseTable.Row>

            {isMobile && (
                <TransactionDetailsDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    signature={signature}
                    slot={slot}
                    blockTime={blockTime}
                    statusLabel={badge.label}
                    statusVariant={badge.variant}
                    instructionNames={instructionNames}
                />
            )}
        </>
    );
}

// Size (bytes) cell: a byte-size button that opens the raw data (hex/base64 + copy +
// download) in a popover. Fetches on mount so the size shows without interaction.
function TransactionRawDataSize({ signature }: { signature: string }) {
    const fetchRaw = useFetchRawTransaction();
    const rawDetails = useRawTransactionDetails(signature);
    const transactionData = rawDetails?.data?.raw?.messageBytes;
    const loading = rawDetails === undefined || rawDetails.status === FetchStatus.Fetching;

    useEffect(() => {
        if (!transactionData && rawDetails === undefined) fetchRaw(signature);
    }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AccountSizeField
            size={transactionData?.length}
            data={transactionData}
            filename={signature}
            loading={loading}
            // Collapse the button's fixed height so the size sits on the same line as the other
            // top-aligned cells; text-sm + top-0.5 keep it level with their text baseline.
            buttonClassName="relative top-0.5 !h-auto !py-0 text-sm"
        />
    );
}
