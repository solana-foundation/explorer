import { gen } from '@__fixtures__/gen';
import {
    AccountRole,
    address,
    appendTransactionMessageInstruction,
    blockhash,
    compileTransactionMessage,
    createTransactionMessage,
    getBase58Decoder,
    getCompiledTransactionMessageEncoder,
    type Instruction,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { AddressLookupTableAccount, PublicKey, SystemProgram } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { createWeb3TransactionMessage, FEE_PAYER, RECIPIENT } from '../../__fixtures__/wire-transactions';
import type { RawTransaction } from '../../model/types';
import {
    getInnerInstructionsFromRawTransaction,
    getInstructionsFromRawTransaction,
} from '../get-instructions-from-raw-transaction';

type CompiledInner = { accounts: number[]; data: string; programIdIndex: number };
type LoadedAddresses = { readonly: string[]; writable: string[] };

const PROGRAM = address(gen.address(5));
const TABLE = new PublicKey(gen.address(6));
const DATA = new Uint8Array([2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]);
const DATA_BASE58 = getBase58Decoder().decode(DATA);

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

function withInner(raw: RawTransaction, instructions: CompiledInner[], loadedAddresses?: LoadedAddresses) {
    const meta = {
        innerInstructions: [{ index: 0, instructions }],
        loadedAddresses,
        postBalances: [],
        preBalances: [],
    };
    return { ...raw, meta };
}

function legacyRaw(instructions: CompiledInner[]): RawTransaction {
    const transaction = createWeb3TransactionMessage();
    const message = transaction.compileToLegacyMessage();
    const raw: RawTransaction = {
        message,
        messageBytes: message.serialize(),
        serializedSize: 0,
        signatures: [],
        slot: 0,
        transaction,
        version: 'legacy',
    };
    return withInner(raw, instructions);
}

function v0RawWithLookup(instructions: CompiledInner[], loadedAddresses?: LoadedAddresses) {
    const table = new AddressLookupTableAccount({
        key: TABLE,
        state: { addresses: [new PublicKey(RECIPIENT)] } as never,
    });
    const transaction = createWeb3TransactionMessage();
    const message = transaction.compileToV0Message([table]);
    const raw: RawTransaction = {
        message,
        messageBytes: message.serialize(),
        serializedSize: 0,
        signatures: [],
        slot: 0,
        transaction,
        version: 0,
    };
    return withInner(raw, instructions, loadedAddresses);
}

function firstInner(raw: RawTransaction) {
    const [instruction] = getInnerInstructionsFromRawTransaction(raw).get(0) ?? [];
    return instruction && { ...instruction, data: Array.from(instruction.data) };
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

describe('getInnerInstructionsFromRawTransaction', () => {
    it('should return an empty map when the transaction has no inner instructions', () => {
        const raw = legacyRaw([]);

        expect(getInnerInstructionsFromRawTransaction({ ...raw, meta: undefined }).size).toBe(0);
    });

    it('should resolve the accounts, roles, and data of an inner instruction when the message is legacy', () => {
        const raw = legacyRaw([{ accounts: [0, 1], data: DATA_BASE58, programIdIndex: 2 }]);

        expect(firstInner(raw)).toEqual({
            accounts: [
                { address: FEE_PAYER, role: AccountRole.WRITABLE_SIGNER },
                { address: RECIPIENT, role: AccountRole.WRITABLE },
            ],
            data: Array.from(DATA),
            programAddress: SystemProgram.programId.toBase58(),
        });
    });

    it('should resolve an account index into the loaded addresses when the message is v0 with lookup tables', () => {
        const raw = v0RawWithLookup([{ accounts: [0, 2], data: DATA_BASE58, programIdIndex: 1 }], {
            readonly: [],
            writable: [RECIPIENT],
        });

        expect(firstInner(raw)?.accounts.map(account => account.address)).toEqual([FEE_PAYER, RECIPIENT]);
    });

    it('should throw when a v0 message has lookup tables and the meta has no loaded addresses', () => {
        const raw = v0RawWithLookup([{ accounts: [0, 2], data: DATA_BASE58, programIdIndex: 1 }]);

        expect(() => getInnerInstructionsFromRawTransaction(raw)).toThrow('lookups were not resolved');
    });

    it('should resolve the static accounts when the message is v1', () => {
        const raw = withInner(
            v1Raw({ accounts: [{ address: RECIPIENT, role: AccountRole.WRITABLE }], programAddress: PROGRAM }),
            [{ accounts: [1], data: DATA_BASE58, programIdIndex: 2 }],
        );

        expect(firstInner(raw)).toEqual({
            accounts: [{ address: RECIPIENT, role: AccountRole.WRITABLE }],
            data: Array.from(DATA),
            programAddress: PROGRAM,
        });
    });

    it('should keep an undefined entry when an inner instruction has an out-of-range account index', () => {
        const raw = legacyRaw([
            { accounts: [9], data: DATA_BASE58, programIdIndex: 2 },
            { accounts: [0, 1], data: DATA_BASE58, programIdIndex: 2 },
        ]);

        const [unresolved, resolved] = getInnerInstructionsFromRawTransaction(raw).get(0) ?? [];

        expect(unresolved).toBeUndefined();
        expect(resolved?.programAddress).toBe(SystemProgram.programId.toBase58());
    });
});
