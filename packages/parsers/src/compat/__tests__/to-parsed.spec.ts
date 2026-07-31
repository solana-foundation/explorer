import { PublicKey, TransactionInstruction, type VersionedMessage } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { toParsedInstruction, toParsedTransaction } from '../index.js';

const PROGRAM_ID = new PublicKey(gen.tokenProgram);
const SIGNER = new PublicKey(gen.systemProgram);
const READONLY = new PublicKey(gen.sysvarRent);

describe('toParsedInstruction', () => {
    it('should wrap slice output into the canonical ParsedInstruction shape', () => {
        expect(toParsedInstruction({ info: { amount: 5 }, type: 'transfer' }, 'spl-token', PROGRAM_ID)).toEqual({
            parsed: { info: { amount: 5 }, type: 'transfer' },
            program: 'spl-token',
            programId: PROGRAM_ID,
        });
    });
});

describe('toParsedTransaction', () => {
    const instruction = new TransactionInstruction({
        data: Buffer.from([]),
        keys: [
            { isSigner: true, isWritable: true, pubkey: SIGNER },
            { isSigner: false, isWritable: false, pubkey: READONLY },
        ],
        programId: PROGRAM_ID,
    });
    const message = {
        addressTableLookups: [],
        recentBlockhash: 'GHtXQBbU2vKfGsFqgEz',
    } as unknown as VersionedMessage;

    it('should convert instruction keys into ParsedMessageAccounts with transaction provenance', () => {
        const result = toParsedTransaction(instruction, message);

        expect(result.message.accountKeys).toEqual([
            { pubkey: SIGNER, signer: true, source: 'transaction', writable: true },
            { pubkey: READONLY, signer: false, source: 'transaction', writable: false },
        ]);
        expect(result.message.recentBlockhash).toBe('GHtXQBbU2vKfGsFqgEz');
    });

    it('should default instructions and signatures to empty lists', () => {
        const result = toParsedTransaction(instruction, message);

        expect(result.message.instructions).toEqual([]);
        expect(result.signatures).toEqual([]);
    });

    it('should carry explicit instructions and signatures through', () => {
        const parsedInstruction = {
            parsed: { info: {}, type: 'transfer' },
            program: 'spl-token',
            programId: PROGRAM_ID,
        };

        const result = toParsedTransaction(instruction, message, [parsedInstruction], ['sig-1']);

        expect(result.message.instructions).toEqual([parsedInstruction]);
        expect(result.signatures).toEqual(['sig-1']);
    });
});
