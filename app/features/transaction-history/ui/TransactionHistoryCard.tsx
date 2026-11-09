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
import { cn } from '@components/shared/utils';
import { FetchStatus } from '@providers/cache';
import { address as toAddress } from '@solana/kit';
import { displayTimestampUtc } from '@utils/date';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { useVisibility } from '@/app/shared/lib/visibility';
import { RelativeTime } from '@/app/shared/RelativeTime';
import { DataListRow } from '@/app/shared/ui/DataListCard';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

import { isGtfaDisabled } from '../lib/gtfa-disabled-addresses';
import { useAccountHistory, useHistoryFiltersSupported, useResetAccountHistory } from '../model/use-account-history';
import { useFetchAccountHistory } from '../model/use-fetch-account-history';
import { useResolvedRowTransaction } from '../model/use-resolved-row-transaction';
import {
    BaseTransactionHistoryCard,
    historyGridCols,
    STATUS_BADGE,
    type TransactionHistoryRowView,
} from './BaseTransactionHistoryCard';
import { CompactKeyValue } from './CompactKeyValue';
import { ProgramsBlock } from './InstructionList';
import { RawDataSizeField } from './RawDataSizeField';
import { TransactionDetailsDrawer } from './TransactionDetailsDrawer';

export function TransactionHistoryCard({ address }: { address: string }) {
    const historyAddress = useMemo(() => toAddress(address), [address]);
    // One breakpoint subscription for the whole card — each row reads `isLg` as a prop rather than
    // registering its own matchMedia listeners (25 rows × several media queries otherwise).
    const { isLg } = useBreakpoint();
    const filters = useHistoryFilters();
    const hasActiveFilters = Object.values(filters).some(value => value !== undefined);
    const filtersKey = JSON.stringify(filters);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory(25, filters);
    const resetHistory = useResetAccountHistory();
    const filtersSupported = useHistoryFiltersSupported() && !isGtfaDisabled(address);
    const clearFilters = useClearHistoryFilters();

    // Signatures only. Each row fetches its own transaction once it is visible, one at a time, so the page
    // never sends a burst of calls that the RPC rate limits.
    const refresh = useCallback(
        () => fetchAccountHistory(historyAddress, false, true),
        [fetchAccountHistory, historyAddress],
    );
    const loadMore = useCallback(
        () => fetchAccountHistory(historyAddress, false),
        [fetchAccountHistory, historyAddress],
    );

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

    const previousFiltersKey = useRef(filtersKey);
    useEffect(() => {
        if (previousFiltersKey.current !== filtersKey) {
            previousFiltersKey.current = filtersKey;
            resetHistory(address);
            refresh();
        }
    }, [filtersKey, address, resetHistory, refresh]);

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
            failed={history.status === FetchStatus.FetchFailed}
            foundOldest={history.data.foundOldest}
            onRefresh={refresh}
            onLoadMore={loadMore}
            headerActions={<HistoryFilterTrigger address={address} {...filters} />}
            headerSubRow={hasActiveFilters ? <HistoryFilterChips {...filters} /> : undefined}
            renderRow={(row, hasTimestamps) => (
                <TransactionRow key={row.signature} row={row} hasTimestamps={hasTimestamps} isLg={isLg} />
            )}
        />
    );
}

function TransactionRow({
    row,
    hasTimestamps,
    isLg,
}: {
    row: TransactionHistoryRowView;
    hasTimestamps: boolean;
    isLg: boolean;
}) {
    const { signature, slot, blockTime, status } = row;
    const { isVisible, ref } = useVisibility<HTMLDivElement>(true);
    const rowTransaction = useResolvedRowTransaction(signature, isVisible);
    const [drawerOpen, setDrawerOpen] = useState(false);
    // Mount the mobile drawer only once the row is first tapped, so the page does not mount a closed
    // drawer for every row up front.
    const [drawerMounted, setDrawerMounted] = useState(false);
    const badge = STATUS_BADGE[status];

    // If the viewport crosses to desktop while the drawer is open, close it gracefully
    useEffect(() => {
        if (isLg) setDrawerOpen(false);
    }, [isLg]);

    const openDrawer = () => {
        setDrawerMounted(true);
        setDrawerOpen(true);
    };

    const programsBlock = <ProgramsBlock state={rowTransaction} />;

    const signatureLink = <Signature signature={signature} link />;
    const statusBadge = (
        <Badge ui="dashkit" tone="soft" variant={badge.variant}>
            {badge.label}
        </Badge>
    );

    const handleRowClick = (e: React.MouseEvent) => {
        // Skip the drawer when the user actually clicked a real link/button in the row.
        if (e.target instanceof HTMLElement && e.target.closest('a, button')) return;
        if (!isLg) openDrawer();
    };

    return (
        <>
            <DataListRow
                ref={ref}
                onClick={!isLg ? handleRowClick : undefined}
                className="cursor-pointer lg:cursor-auto"
            >
                <div className={cn('flex flex-col text-sm lg:hidden', ROW_PADDING)}>
                    <MobileField label="Signature">
                        <div className="flex min-w-0 items-start gap-2">
                            <span className="min-w-0">{signatureLink}</span>
                            {statusBadge}
                        </div>
                    </MobileField>
                    {blockTime ? (
                        <MobileField label="Time">{displayTimestampUtc(blockTime * 1000, true)}</MobileField>
                    ) : null}
                    <MobileField label="Block">
                        {/* Plain text on mobile — the drawer carries the block link. */}
                        <Slot slot={slot} />
                    </MobileField>
                    <MobileField label="Programs">{programsBlock}</MobileField>
                </div>

                <div className={cn('hidden items-baseline gap-4 lg:grid', ROW_PADDING, historyGridCols(hasTimestamps))}>
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="min-w-0 text-sm">{signatureLink}</span>
                            {statusBadge}
                        </div>
                        <div className="mt-1">{programsBlock}</div>
                    </div>

                    {hasTimestamps && (
                        <div className="text-outer-space-300">
                            {blockTime ? (
                                // Two-line stack: absolute UTC timestamp on top, relative age beneath.
                                <div className="flex flex-col">
                                    <span className="text-sm">{displayTimestampUtc(blockTime * 1000, true)}</span>
                                    <span className="text-sm">
                                        <RelativeTime date={blockTime * 1000} />
                                    </span>
                                </div>
                            ) : (
                                '---'
                            )}
                        </div>
                    )}

                    <div>
                        <span className="text-sm">
                            <Slot slot={slot} link />
                        </span>
                    </div>

                    {isLg && (
                        <div>
                            <RawDataSizeField state={rowTransaction} filename={signature} />
                        </div>
                    )}
                </div>
            </DataListRow>

            {drawerMounted && (
                <TransactionDetailsDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    signature={signature}
                    slot={slot}
                    blockTime={blockTime}
                    statusLabel={badge.label}
                    statusVariant={badge.variant}
                    rowTransaction={rowTransaction}
                />
            )}
        </>
    );
}

function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <CompactKeyValue divider={false} label={label}>
            {children}
        </CompactKeyValue>
    );
}
