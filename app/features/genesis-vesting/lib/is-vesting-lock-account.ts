import type { Account } from '@providers/accounts';

import { GENESIS_PROGRAM_ADDRESS } from './constants';
import { isVestingLockData } from './read-vesting-lock';

/** Selects the vesting lock card on the account page: a Genesis-owned `ClaimScheduleBucketV2`. */
export function isVestingLockAccount(account: Account): boolean {
    if (account.owner.toBase58() !== GENESIS_PROGRAM_ADDRESS) return false;
    return Boolean(account.data.raw && isVestingLockData(account.data.raw));
}
