import type { TransactionWithMeta } from '@entities/transaction-data';
import type { ConfirmedSignatureInfo } from '@solana/web3.js';

export type TransactionMap = Map<string, TransactionWithMeta>;
// The reason a row has no transaction. A row that no fetch has tried has no reason.
export type MissingTransactionReason = 'failed' | 'skipped';
export type MissingTransactions = Map<string, MissingTransactionReason>;

export type ParsedTransactionResult =
    { status: 'loaded'; transaction: TransactionWithMeta } | { status: MissingTransactionReason };

// `getTransactionsForAddress` returns a transaction's position within its slot; the standard
// `getSignaturesForAddress` does not. Optional so both sources share one row type.
export type HistoryRow = ConfirmedSignatureInfo & { transactionIndex?: number };

export type AccountHistory = {
    fetched: HistoryRow[];
    transactionMap?: TransactionMap;
    missingTransactions?: MissingTransactions;
    foundOldest: boolean;
    // Opaque cursor returned by the RPC; threaded back to load the next page. Absent once
    // the stream ends — the wire's `null` is normalised away at the api boundary.
    paginationToken?: string;
};

export type HistoryUpdate =
    // `append` is true when the page extends the tail (Load More), and false on a refresh.
    { history: AccountHistory | undefined; append: boolean } | { signature: string; result: ParsedTransactionResult };
