import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
import {
    AccountRole,
    address,
    appendTransactionMessageInstruction,
    blockhash,
    compileTransactionMessage,
    createTransactionMessage,
    getBase58Decoder,
    getCompiledTransactionMessageEncoder,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { createWeb3TransactionMessage, FEE_PAYER, RECIPIENT } from '../../__fixtures__/wire-transactions';
import type { RawTransaction } from '../../model/types';
import { readRawInnerInstructions, readRawInstructions } from '../read-raw-instructions';

type CompiledInner = { accounts: number[]; data: string; programIdIndex: number };

const PROGRAM = address(gen.address(5));
const DATA = new Uint8Array([2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]);
const BROWSER_REPORT = { sentry: 'always', sentryExtras: { signature: DEFAULT_SIGNATURE, version: 1 } };

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

    it('should report to Sentry from the browser and hold no instructions when a v1 message cannot be decompiled', () => {
        const logError = vi.spyOn(Logger, 'error').mockImplementation(() => {});

        expect(readRawInstructions(v1Raw(new Uint8Array([0x81])))).toBeUndefined();
        expect(logError).toHaveBeenCalledWith(expect.any(Error), BROWSER_REPORT);
        logError.mockRestore();
    });
});

describe('readRawInnerInstructions', () => {
    it('should resolve the inner instructions in web3.js form, keyed by the index of their parent', () => {
        const raw = legacyRaw([{ accounts: [0, 1], data: getBase58Decoder().decode(DATA), programIdIndex: 2 }]);

        expect(readRawInnerInstructions(raw)).toEqual(
            new Map([
                [
                    0,
                    [
                        new TransactionInstruction({
                            data: Buffer.from(DATA),
                            keys: [
                                { isSigner: true, isWritable: true, pubkey: new PublicKey(FEE_PAYER) },
                                { isSigner: false, isWritable: true, pubkey: new PublicKey(RECIPIENT) },
                            ],
                            programId: SystemProgram.programId,
                        }),
                    ],
                ],
            ]),
        );
    });

    it('should keep an inner instruction with an out-of-range account index undefined', () => {
        const raw = legacyRaw([{ accounts: [9], data: '', programIdIndex: 2 }]);

        expect(readRawInnerInstructions(raw)).toEqual(new Map([[0, [undefined]]]));
    });

    it('should report to Sentry from the browser and hold no inner instructions when they do not resolve', () => {
        const logError = vi.spyOn(Logger, 'error').mockImplementation(() => {});
        const raw = withInner(v1Raw(new Uint8Array([0x81])), [{ accounts: [0], data: '', programIdIndex: 0 }]);

        expect(readRawInnerInstructions(raw)).toBeUndefined();
        expect(logError).toHaveBeenCalledWith(expect.any(Error), BROWSER_REPORT);
        logError.mockRestore();
    });
});

function legacyRaw(instructions: CompiledInner[]): RawTransaction {
    const transaction = createWeb3TransactionMessage();
    const message = transaction.compileToLegacyMessage();
    return withInner(
        {
            message,
            messageBytes: message.serialize(),
            serializedSize: 0,
            signatures: [],
            slot: 0,
            transaction,
            version: 'legacy',
        },
        instructions,
    );
}

function withInner(raw: RawTransaction, instructions: CompiledInner[]): RawTransaction {
    return { ...raw, meta: { innerInstructions: [{ index: 0, instructions }], postBalances: [], preBalances: [] } };
}

function v1Raw(messageBytes: Uint8Array): RawTransaction {
    return { messageBytes, serializedSize: 0, signatures: [DEFAULT_SIGNATURE], slot: 0, version: 1 };
}
