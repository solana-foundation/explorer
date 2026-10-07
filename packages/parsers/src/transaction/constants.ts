/** Base fee per signature, in lamports. */
export const LAMPORTS_PER_SIGNATURE = 5_000n;

/** v1 budgets 0 bytes for an absent `loadedAccountsDataSizeLimit`, not the pre-v1 64 MiB default, per SIMD-0385. */
export const V1_DEFAULT_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BYTES = 0;

/** v1 budgets the runtime's minimum heap frame, `MIN_HEAP_FRAME_BYTES`, for an absent `heapSize`. */
export const V1_DEFAULT_HEAP_SIZE_BYTES = 32 * 1024;
