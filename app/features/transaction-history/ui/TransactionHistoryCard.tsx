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
import {
    isGtfaDisabled,
    useAccountHistory,
    useFetchAccountHistory,
    useHistoryFiltersSupported,
    useResetAccountHistory,
} from '@providers/accounts/history';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { BaseTransactionHistoryCard, type TransactionHistoryRowView } from './BaseTransactionHistoryCard';
import { InstructionsCell } from './InstructionsCell';
import { TransactionRawDataCell } from './TransactionRawDataCell';

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

    // Signatures only — the parsed transactions for instruction names are fetched lazily per row, one at a
    // time (see InstructionsCell), so the page never batch-hammers the RPC into 429s.
    const refresh = useCallback(() => fetchAccountHistory(pubkey, false, true), [fetchAccountHistory, pubkey]);
    const loadMore = useCallback(() => fetchAccountHistory(pubkey, false), [fetchAccountHistory, pubkey]);

    const rows: TransactionHistoryRowView[] = history?.data?.fetched
        ? getTransactionRows(history.data.fetched).map(row => ({
              blockTime: row.blockTime,
              instructionsCell: <InstructionsCell signature={row.signature} />,
              rawDataCell: <TransactionRawDataCell signature={row.signature} />,
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
        />
    );
}
