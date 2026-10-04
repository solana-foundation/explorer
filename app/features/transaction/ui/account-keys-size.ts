import type { ParsedMessageAccount } from '@solana/web3.js';

// Every static account key occupies 32 bytes in the transaction message.
export const ACCOUNT_KEY_SIZE_BYTES = 32;

/**
 * The static account-keys footprint of a transaction message: 32 bytes per key that
 * travels in the message itself. Addresses resolved through address lookup tables are
 * excluded — they occupy no static key slot. Developers compare this against the
 * 1232-byte transaction size limit when optimizing.
 */
export function getStaticAccountKeysSize(accountKeys: readonly ParsedMessageAccount[]): {
    accountCount: number;
    sizeBytes: number;
} {
    const accountCount = accountKeys.filter(account => account.source !== 'lookupTable').length;
    return { accountCount, sizeBytes: accountCount * ACCOUNT_KEY_SIZE_BYTES };
}
