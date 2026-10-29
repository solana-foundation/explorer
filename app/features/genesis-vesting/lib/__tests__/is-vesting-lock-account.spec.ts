import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { TEAM_LOCK } from '../../__tests__/__fixtures__/lock-accounts';
import { GENESIS_PROGRAM_ADDRESS } from '../constants';
import { isVestingLockAccount } from '../is-vesting-lock-account';

describe('isVestingLockAccount', () => {
    it('should accept a Genesis-owned ClaimScheduleBucketV2', () => {
        expect(isVestingLockAccount(account(GENESIS_PROGRAM_ADDRESS, lockBytes()))).toBe(true);
    });

    it('should reject the same bytes under another owner', () => {
        expect(isVestingLockAccount(account(gen.address(1), lockBytes()))).toBe(false);
    });
});

function lockBytes(): Uint8Array {
    return new Uint8Array(Buffer.from(TEAM_LOCK.base64, 'base64'));
}

function account(owner: string, raw: Uint8Array): Account {
    return {
        data: { raw },
        executable: false,
        lamports: 1,
        owner: new PublicKey(owner),
        pubkey: gen.publicKey(0),
        space: raw.length,
    };
}
