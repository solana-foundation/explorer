import type { TransactionVersion } from '@solana/kit';

/**
 * A transaction version as the UI writes it: `legacy` bare, every numbered version `v`-prefixed.
 */
export function formatTransactionVersion(version: TransactionVersion): string {
    return version === 'legacy' ? version : `v${version}`;
}
