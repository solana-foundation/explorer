import { type ParsedMessageAccount, PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { ACCOUNT_KEY_SIZE_BYTES, getStaticAccountKeysSize } from '../account-keys-size';

function staticAccount(): ParsedMessageAccount {
    return { pubkey: PublicKey.default, signer: false, source: 'transaction', writable: false };
}

function lookupTableAccount(): ParsedMessageAccount {
    return { pubkey: PublicKey.default, signer: false, source: 'lookupTable', writable: false };
}

describe('getStaticAccountKeysSize', () => {
    it('should measure 32 bytes per static account key', () => {
        expect(getStaticAccountKeysSize([staticAccount(), staticAccount(), staticAccount()])).toEqual({
            accountCount: 3,
            sizeBytes: 3 * ACCOUNT_KEY_SIZE_BYTES,
        });
    });

    // Lookup-table addresses are resolved dynamically, so they occupy no static key
    // slot in the message — the transaction-size estimate must exclude them.
    it('should exclude address lookup table accounts', () => {
        expect(getStaticAccountKeysSize([staticAccount(), lookupTableAccount(), lookupTableAccount()])).toEqual({
            accountCount: 1,
            sizeBytes: ACCOUNT_KEY_SIZE_BYTES,
        });
    });

    it('should keep legacy accounts without a source', () => {
        const legacy = { pubkey: PublicKey.default, signer: true, writable: true };
        expect(getStaticAccountKeysSize([legacy as ParsedMessageAccount, lookupTableAccount()])).toEqual({
            accountCount: 1,
            sizeBytes: ACCOUNT_KEY_SIZE_BYTES,
        });
    });

    it('should return zero for an empty account list', () => {
        expect(getStaticAccountKeysSize([])).toEqual({ accountCount: 0, sizeBytes: 0 });
    });
});
