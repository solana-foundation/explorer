import { mergeTransactionMap } from '@/app/entities/transaction-data';

import type { AccountHistory, HistoryRow, HistoryUpdate, ParsedTransactionResult } from './types';

// Merges one update into the cached history for an address. Pure: the cache
// reducer in `@providers/cache` owns storage, this owns the merge rules.
export function reconcile(
    history: AccountHistory | undefined,
    update: HistoryUpdate | undefined,
): AccountHistory | undefined {
    if (update === undefined) return history;
    if ('signature' in update) {
        return history && withTransactionResult({ history, result: update.result, signature: update.signature });
    }
    if (update.history === undefined) return history;

    const { append } = update;

    // A refresh that came back empty is almost always a transient RPC blip, not a real transition to
    // "zero history" (signatures are immutable). Drop it so a flaky empty can't wipe already-loaded rows
    // or flip foundOldest into a false "Fetched full history". The first-ever fetch (no existing history)
    // isn't covered here — fetchSignatures retries that case before it lands.
    if (!append && update.history.fetched.length === 0 && history?.fetched.length) {
        return history;
    }

    const { combined, replaced } = combineFetched(update.history.fetched, history?.fetched, append);

    // The tail cursor only changes when we extended the tail (append) or replaced
    // the whole list; a refresh that merely prepends new items keeps the old tail.
    const tailFromUpdate = append || replaced;

    return {
        fetched: combined,
        foundOldest: tailFromUpdate ? update.history.foundOldest : (history?.foundOldest ?? false),
        // A page has no transactions, so a refresh from a card that fetches none keeps the missing reasons.
        missingTransactions: history?.missingTransactions,
        paginationToken: tailFromUpdate ? update.history.paginationToken : history?.paginationToken,
        transactionMap: history?.transactionMap,
    };
}

function withTransactionResult({
    history,
    signature,
    result,
}: {
    history: AccountHistory;
    signature: string;
    result: ParsedTransactionResult;
}): AccountHistory {
    const missingTransactions = new Map(history.missingTransactions);
    if (result.status !== 'loaded') {
        missingTransactions.set(signature, result.status);
        return { ...history, missingTransactions };
    }
    missingTransactions.delete(signature);
    const transactionMap = mergeTransactionMap(history.transactionMap, new Map([[signature, result.transaction]]));
    return { ...history, missingTransactions, transactionMap };
}

function combineFetched(
    fetched: HistoryRow[],
    current: HistoryRow[] | undefined,
    append: boolean,
): { combined: HistoryRow[]; replaced: boolean } {
    if (current === undefined || current.length === 0) {
        return { combined: fetched, replaced: true };
    }

    // More history was loaded: append, dropping any signatures we already hold.
    if (append) {
        const seen = new Set(current.map(c => c.signature));
        return { combined: current.concat(fetched.filter(f => !seen.has(f.signature))), replaced: false };
    }

    // History was refreshed: prepend the newly-seen prefix if the page overlaps
    // what we already have, otherwise treat it as a full replacement.
    const end = fetched.findIndex(f => f.signature === current[0].signature);
    if (end < 0) return { combined: fetched, replaced: true };
    return { combined: fetched.slice(0, end).concat(current), replaced: false };
}
