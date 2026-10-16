import { gen } from '@__fixtures__/gen';
import {
    AccountRole,
    address,
    appendTransactionMessageInstruction,
    blockhash,
    compileTransactionMessage,
    createTransactionMessage,
    getCompiledTransactionMessageEncoder,
    type Instruction,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { SystemProgram } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { createWeb3TransactionMessage, FEE_PAYER, RECIPIENT } from '../../__fixtures__/wire-transactions';
import type { RawTransaction } from '../../model/types';
import { getInstructionsFromRawTransaction } from '../get-instructions-from-raw-transaction';

const PROGRAM = address(gen.address(5));
const DATA = new Uint8Array([2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]);

function v0Raw(): RawTransaction {
    const transaction = createWeb3TransactionMessage();
    const message = transaction.compileToV0Message();

    return {
        message,
        messageBytes: message.serialize(),
        serializedSize: 0,
        signatures: [],
        slot: 0,
        transaction,
        version: 0,
    };
}

function v1Raw(instruction: Instruction): RawTransaction {
    const message = pipe(
        createTransactionMessage({ version: 1 }),
        m => setTransactionMessageFeePayer(FEE_PAYER, m),
        m =>
            setTransactionMessageLifetimeUsingBlockhash(
                { blockhash: blockhash(gen.blockhash()), lastValidBlockHeight: 1n },
                m,
            ),
        m => appendTransactionMessageInstruction(instruction, m),
    );
    const messageBytes = new Uint8Array(
        getCompiledTransactionMessageEncoder().encode(compileTransactionMessage(message)),
    );

    return { messageBytes, serializedSize: 0, signatures: [], slot: 0, version: 1 };
}

describe('getInstructionsFromRawTransaction', () => {
    it('should convert the decompiled instructions when the message is v0', () => {
        const [instruction] = getInstructionsFromRawTransaction(v0Raw());

        expect(instruction.programAddress).toBe(SystemProgram.programId.toBase58());
        expect(instruction.accounts.map(account => account.address)).toEqual([FEE_PAYER, RECIPIENT]);
    });

    it('should decompile the message bytes when the message is v1', () => {
        const accounts = [{ address: RECIPIENT, role: AccountRole.WRITABLE }];

        const [instruction] = getInstructionsFromRawTransaction(
            v1Raw({ accounts, data: DATA, programAddress: PROGRAM }),
        );

        expect(instruction).toEqual({ accounts, data: DATA, programAddress: PROGRAM });
    });

    it('should return empty accounts and data when a v1 instruction has none', () => {
        const [instruction] = getInstructionsFromRawTransaction(v1Raw({ programAddress: PROGRAM }));

        expect(instruction).toEqual({ accounts: [], data: new Uint8Array(), programAddress: PROGRAM });
    });
});
