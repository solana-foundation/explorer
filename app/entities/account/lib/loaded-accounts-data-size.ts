import type { LoadedAccounts } from '../api/fetch-loaded-accounts';

// SIMD-0186's flat per-account charge for metadata, not the size of any serialized header.
const TRANSACTION_ACCOUNT_BASE_SIZE = 64;

/** The loaded accounts data size charged to a v1 transaction, which has no lookup tables to add. */
export function getLoadedAccountsDataSize({ accountCount, dataSize }: LoadedAccounts): number {
    return dataSize + accountCount * TRANSACTION_ACCOUNT_BASE_SIZE;
}
