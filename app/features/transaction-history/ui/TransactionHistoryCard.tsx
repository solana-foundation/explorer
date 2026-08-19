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
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
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

export function TransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const filters = useHistoryFilters();
    const hasActiveFilters = Object.values(filters).some(value => value !== undefined);
    const filtersKey = JSON.stringify(filters);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory(25, filters);
    const resetHistory = useResetAccountHistory();
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
    const instructionNames = useResolvedInstructionSummaries(signature, isVisible);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { isLg } = useBreakpoint();
    const badge = STATUS_BADGE[status];

    const programsBlock =
        instructionNames !== undefined && instructionNames.length > 0 ? (
            <InstructionList instructions={instructionNames} />
        ) : instructionNames === undefined ? (
            <InstructionListSkeleton />
        ) : (
            <span className="text-outer-space-300">---</span>
        );

    const signatureLink = <Signature signature={signature} link />;
    const statusBadge = (
        <Badge ui="dashkit" tone="soft" variant={badge.variant}>
            {badge.label}
        </Badge>
    );

    const handleRowClick = (e: React.MouseEvent) => {
        // Skip the drawer when the user actually clicked a real link/button in the row.
        if (e.target instanceof HTMLElement && e.target.closest('a, button')) return;
        if (!isLg) setDrawerOpen(true);
    };

    return (
        <>
            <BaseTable.Row ref={ref} onClick={!isLg ? handleRowClick : undefined}>
                {/* First cell carries the whole mobile card (the other cells are hidden < lg). */}
                <BaseTable.Cell>
                    {/* Desktop: signature + status inline (14px), programs stacked beneath. */}
                    <div className="hidden lg:block">
                        <div className="flex min-w-0 items-start gap-2">
                            <span className="min-w-0 text-sm">{signatureLink}</span>
                            {/* top-1 drops the badge 4px so it sits lower against the signature,
                                without affecting row height. */}
                            <span className="relative top-1">{statusBadge}</span>
                        </div>
                        <div className="mt-1">{programsBlock}</div>
                    </div>

                    {/* Mobile: the row becomes a labelled card. Every field is captioned and Programs
                        sits at the end (agreed design — see PR #109). Tapping the card opens the drawer. */}
                    <div className="flex flex-col gap-2 text-sm lg:hidden">
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
                </BaseTable.Cell>

                {hasTimestamps && (
                    <BaseTable.Cell className="w-px text-outer-space-300">
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
                    </BaseTable.Cell>
                )}

                <BaseTable.Cell className="w-px">
                    <span className="text-sm">
                        <Slot slot={slot} link />
                    </span>
                </BaseTable.Cell>

                {isLg && (
                    <BaseTable.Cell className="w-px">
                        <TransactionRawDataSize signature={signature} />
                    </BaseTable.Cell>
                )}
            </BaseTable.Row>

            {!isLg && (
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

// A captioned field for the mobile transaction card: muted label column + value. The 5rem label
// column matches the drawer's DrawerRow so the card and its drawer read consistently.
function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-3">
            <span className="w-20 shrink-0 text-outer-space-300">{label}</span>
            <span className="min-w-0 flex-1 text-white">{children}</span>
        </div>
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
            buttonClassName="relative top-0.5 !h-auto !py-0 !text-sm [&_svg]:!size-3.5"
        />
    );
}
