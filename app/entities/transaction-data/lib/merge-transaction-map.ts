import type { TransactionWithMeta } from '../model/types';

type TransactionMap = Map<string, TransactionWithMeta>;

export function mergeTransactionMap(current: TransactionMap | undefined, update: TransactionMap | undefined) {
    if (!update) {
        return current ?? new Map<string, TransactionWithMeta>();
    }

    return new Map([...(current ?? []), ...update]);
}
