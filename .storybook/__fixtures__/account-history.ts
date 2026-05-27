import type { AccountHistory } from '@providers/accounts/history';
import type { CacheEntry } from '@providers/cache';
import { FetchStatus } from '@providers/cache';
import type { ConfirmedSignatureInfo } from '@solana/web3.js';

import { gen } from '@/app/__fixtures__/gen';

type SignatureOverrides = Partial<ConfirmedSignatureInfo>;

export function mockConfirmedSignatureInfo(overrides: SignatureOverrides = {}): ConfirmedSignatureInfo {
    return {
        blockTime: 1_716_000_000,
        confirmationStatus: 'finalized',
        err: null,
        memo: null,
        signature: gen.signature(),
        slot: 312_456_789,
        ...overrides,
    };
}

type AccountHistoryOverrides = Partial<AccountHistory>;

export function mockAccountHistory(overrides: AccountHistoryOverrides = {}): CacheEntry<AccountHistory> {
    return {
        data: {
            failedTransactionSignatures: overrides.failedTransactionSignatures,
            fetched: overrides.fetched ?? [],
            foundOldest: overrides.foundOldest ?? true,
            transactionMap: overrides.transactionMap,
        },
        status: FetchStatus.Fetched,
    };
}
