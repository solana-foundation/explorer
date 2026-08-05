import { AccountRole } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { toKitAddress, toKitInstruction, toLegacyPublicKey } from '../index.js';

const PROGRAM_ID = new PublicKey(gen.tokenProgram);
const KEYS = [
    { isSigner: true, isWritable: true, pubkey: new PublicKey(gen.systemProgram) },
    {
        isSigner: true,
        isWritable: false,
        pubkey: new PublicKey(gen.sysvarRent),
    },
    {
        isSigner: false,
        isWritable: true,
        pubkey: new PublicKey(gen.sysvarClock),
    },
    {
        isSigner: false,
        isWritable: false,
        pubkey: new PublicKey(gen.voteProgram),
    },
];

describe('toKitInstruction', () => {
    it('should map every signer/writable combination onto kit account roles', () => {
        const kitIx = toKitInstruction(
            new TransactionInstruction({
                data: Buffer.from([1, 2]),
                keys: KEYS,
                programId: PROGRAM_ID,
            }),
        );

        expect(kitIx.programAddress).toBe(PROGRAM_ID.toBase58());
        expect(kitIx.data).toEqual(Buffer.from([1, 2]));
        expect(kitIx.accounts.map(account => account.role)).toEqual([
            AccountRole.WRITABLE_SIGNER,
            AccountRole.READONLY_SIGNER,
            AccountRole.WRITABLE,
            AccountRole.READONLY,
        ]);
        expect(kitIx.accounts.map(account => account.address)).toEqual(KEYS.map(key => key.pubkey.toBase58()));
    });
});

describe('address bridging', () => {
    it('should round-trip between kit addresses and legacy public keys', () => {
        const kitAddress = toKitAddress(PROGRAM_ID);

        expect(kitAddress).toBe(PROGRAM_ID.toBase58());
        expect(toLegacyPublicKey(kitAddress).equals(PROGRAM_ID)).toBe(true);
    });
});
