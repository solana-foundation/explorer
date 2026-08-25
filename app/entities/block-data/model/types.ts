import type { TransactionVersion } from '@solana/kit';
import type { VersionedBlockResponse } from '@solana/web3.js';

import type { V1TransactionConfig } from '@/app/shared/lib/v1-message-bridge';

/**
 * A block transaction in the shape the block cards consume.
 *
 * Matches a web3.js `VersionedBlockResponse` entry so existing consumers are unaffected, with the
 * version widened to cover v1, which web3.js `TransactionVersion` cannot describe.
 */
export type BlockTransaction = Omit<VersionedBlockResponse['transactions'][number], 'version'> & {
    transactionConfig?: V1TransactionConfig;
    version: TransactionVersion;
};

/**
 * A block in the shape the block pages consume.
 *
 * Matches web3.js `VersionedBlockResponse` apart from the widened transaction version.
 */
export type BlockWithV1 = Omit<VersionedBlockResponse, 'transactions'> & {
    transactions: BlockTransaction[];
};
