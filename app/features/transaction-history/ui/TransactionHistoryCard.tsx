'use client';

import { getTransactionRows } from '@components/account/HistoryCardComponents';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { useAccountHistory, useFetchAccountHistory } from '@providers/accounts/history';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo } from 'react';

import { BaseTransactionHistoryCard, type TransactionHistoryRowView } from './BaseTransactionHistoryCard';
import { InstructionsCell } from './InstructionsCell';
import { TransactionRawDataCell } from './TransactionRawDataCell';

export function TransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();

    // Signatures only — the parsed transactions for instruction names are fetched lazily per row, one at a
    // time (see InstructionsCell), so the page never batch-hammers the RPC into 429s.
    const refresh = () => fetchAccountHistory(pubkey, false, true);
    const loadMore = () => fetchAccountHistory(pubkey, false);

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
        />
    );
}
