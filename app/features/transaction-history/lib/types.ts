import type { TransactionWithMeta } from '@entities/transaction-data';
import type { ConfirmedSignatureInfo } from '@solana/web3.js';

export type TransactionMap = Map<string, TransactionWithMeta>;
export type FailedTransactionSignatures = Set<string>;

// `getTransactionsForAddress` returns a transaction's position within its slot; the standard
// `getSignaturesForAddress` does not. Optional so both sources share one row type.
export type HistoryRow = ConfirmedSignatureInfo & { transactionIndex?: number };

export type AccountHistory = {
    fetched: HistoryRow[];
    transactionMap?: TransactionMap;
    failedTransactionSignatures?: FailedTransactionSignatures;
    foundOldest: boolean;
    // Opaque cursor returned by the RPC; threaded back to load the next page. Absent once
    // the stream ends — the wire's `null` is normalised away at the api boundary.
    paginationToken?: string;
};

export type HistoryUpdate = {
    history?: AccountHistory;
    transactionMap?: TransactionMap;
    failedTransactionSignatures?: FailedTransactionSignatures;
    // true when this page extends the tail (Load More); false on a refresh.
    append?: boolean;
};
