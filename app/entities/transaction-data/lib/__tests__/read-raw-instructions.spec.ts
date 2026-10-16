import { gen } from '@__fixtures__/gen';
import {
    AccountRole,
    address,
    appendTransactionMessageInstruction,
    blockhash,
    compileTransactionMessage,
    createTransactionMessage,
    getCompiledTransactionMessageEncoder,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { createWeb3TransactionMessage, FEE_PAYER, RECIPIENT } from '../../__fixtures__/wire-transactions';
import type { RawTransaction } from '../../model/types';
import { readRawInstructions } from '../read-raw-instructions';

const PROGRAM = address(gen.address(5));

describe('readRawInstructions', () => {
    it('should keep the instructions of a v0 transaction', () => {
        const transaction = createWeb3TransactionMessage();
        const message = transaction.compileToV0Message();
        const raw: RawTransaction = {
            message,
            messageBytes: message.serialize(),
            serializedSize: 0,
            signatures: [],
            slot: 0,
            transaction,
            version: 0,
        };

        expect(readRawInstructions(raw)).toEqual(transaction.instructions);
    });

    it('should decompile the instructions of a v1 transaction from its message bytes', () => {
        const raw = v1Raw(
            new Uint8Array(
                getCompiledTransactionMessageEncoder().encode(
                    compileTransactionMessage(
                        pipe(
                            createTransactionMessage({ version: 1 }),
                            m => setTransactionMessageFeePayer(FEE_PAYER, m),
                            m =>
                                setTransactionMessageLifetimeUsingBlockhash(
                                    { blockhash: blockhash(gen.blockhash()), lastValidBlockHeight: 1n },
                                    m,
                                ),
                            m =>
                                appendTransactionMessageInstruction(
                                    {
                                        accounts: [{ address: RECIPIENT, role: AccountRole.WRITABLE }],
                                        data: new Uint8Array([1]),
                                        programAddress: PROGRAM,
                                    },
                                    m,
                                ),
                        ),
                    ),
                ),
            ),
        );

        expect(readRawInstructions(raw)).toEqual([
            new TransactionInstruction({
                data: Buffer.from([1]),
                keys: [{ isSigner: false, isWritable: true, pubkey: new PublicKey(RECIPIENT) }],
                programId: new PublicKey(PROGRAM),
            }),
        ]);
    });

    it('should report and hold no instructions when a v1 message cannot be decompiled', () => {
        const logError = vi.spyOn(Logger, 'error').mockImplementation(() => {});

        expect(readRawInstructions(v1Raw(new Uint8Array([0x81])))).toBeUndefined();
        expect(logError).toHaveBeenCalled();
        logError.mockRestore();
    });
});

function v1Raw(messageBytes: Uint8Array): RawTransaction {
    return { messageBytes, serializedSize: 0, signatures: [], slot: 0, version: 1 };
}
