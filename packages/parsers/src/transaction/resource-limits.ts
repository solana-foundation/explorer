import { MAX_COMPUTE_UNITS } from '../programs/compute-budget/index.js';
import { V1_DEFAULT_HEAP_SIZE_BYTES, V1_DEFAULT_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BYTES } from './constants.js';
import type { ParsedTransaction, PriorityFeeLamports } from './types.js';

export type V1ResourceLimits = {
    computeUnitLimit: number;
    heapSizeBytes: number;
    loadedAccountsDataSizeLimitBytes: number;
    priorityFeeLamports: PriorityFeeLamports;
};

/**
 * Effective v1 resource limits: the declared value, or the runtime default where the message declares none.
 * Returns `undefined` for legacy and v0, which budget through Compute Budget instructions instead.
 */
export function getV1ResourceLimits(transaction: Extract<ParsedTransaction, { version: 1 }>): V1ResourceLimits;
export function getV1ResourceLimits(transaction: ParsedTransaction): V1ResourceLimits | undefined;
export function getV1ResourceLimits(transaction: ParsedTransaction): V1ResourceLimits | undefined {
    if (transaction.version !== 1) return undefined;

    const { config } = transaction;
    return {
        computeUnitLimit: Math.min(config?.computeUnitLimit ?? 0, MAX_COMPUTE_UNITS),
        heapSizeBytes: config?.heapSize ?? V1_DEFAULT_HEAP_SIZE_BYTES,
        loadedAccountsDataSizeLimitBytes:
            config?.loadedAccountsDataSizeLimit ?? V1_DEFAULT_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BYTES,
        priorityFeeLamports: config?.priorityFeeLamports ?? 0n,
    };
}
