import { ParsedTransactionWithMeta } from '@solana/web3.js';

type TransactionMap = Map<string, ParsedTransactionWithMeta>;

export function mergeTransactionMap(current: TransactionMap | undefined, update: TransactionMap | undefined) {
    if (!update) {
        return current ?? new Map<string, ParsedTransactionWithMeta>();
    }

    return new Map([...(current ?? []), ...update]);
}
