import { useResolvedSummaryNames } from '@entities/transaction-data/client';

import { type RowTransactionState, useRowTransaction } from './use-row-transaction';

/**
 * A history row's transaction with its program and instruction names resolved from each program's name
 * source. Resolution happens here, so the list components render names and never fetch them. `enabled`
 * gates the queued transaction fetch, so callers can defer it until a row is visible.
 */
export function useResolvedRowTransaction(signature: string, enabled = true): RowTransactionState {
    const state = useRowTransaction(signature, enabled);
    const summaries = useResolvedSummaryNames(state.status === 'loaded' ? state.summaries : undefined);

    return state.status === 'loaded' && summaries ? { ...state, summaries } : state;
}
