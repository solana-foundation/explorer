import bs58 from 'bs58';
import {
    ComputeBudgetProgram,
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';

import { getTransactionInstructionNames } from '../instruction';

function makeTx(instructions: (ParsedInstruction | PartiallyDecodedInstruction)[]): ParsedTransactionWithMeta {
    return {
        meta: null,
        transaction: {
            message: {
                accountKeys: [],
                instructions,
            },
            signatures: [],
        },
    } as unknown as ParsedTransactionWithMeta;
}

describe('getTransactionInstructionNames', () => {
    describe('parsed instructions', () => {
        it('should convert a simple camelCase type to title case', () => {
            const ix = {
                parsed: { info: {}, type: 'transfer' },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;

            const [result] = getTransactionInstructionNames(makeTx([ix]));

            expect(result).toEqual({ name: 'Transfer', program: 'System Program' });
        });

        it('should convert a multi-word camelCase type to title case', () => {
            const ix = {
                parsed: { info: {}, type: 'initializeAccount' },
                program: 'spl-token',
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            } as unknown as ParsedInstruction;

            const [result] = getTransactionInstructionNames(makeTx([ix]));

            expect(result.name).toBe('Initialize Account');
        });

        it('should return Memo when parsed is a string (e.g. memo text)', () => {
            const ix = {
                parsed: 'test',
                program: 'spl-memo',
                programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            } as unknown as ParsedInstruction;

            const [result] = getTransactionInstructionNames(makeTx([ix]));

            expect(result).toEqual({ name: 'Memo', program: 'Memo Program' });
        });

        it('should return Unknown Instruction when parsed is an object without a type field', () => {
            const ix = {
                parsed: { info: {} },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;

            const [result] = getTransactionInstructionNames(makeTx([ix]));

            expect(result).toEqual({ name: 'Unknown Instruction', program: 'System Program' });
        });
    });

    describe('unknown / partially decoded instructions', () => {
        it('should return Unknown Instruction for a non-ComputeBudget partially decoded instruction', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: bs58.encode(new Uint8Array([1, 2, 3])),
                programId: SystemProgram.programId,
            };

            const [result] = getTransactionInstructionNames(makeTx([ix]));

            expect(result).toEqual({ name: 'Unknown Instruction', program: 'System Program' });
        });
    });

    describe('multiple instructions', () => {
        it('should map each instruction in the transaction independently', () => {
            const transfer = {
                parsed: { info: {}, type: 'transfer' },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;

            const limitData = new Uint8Array([2, 0x40, 0x0d, 0x03, 0x00]);
            const setLimit: PartiallyDecodedInstruction = {
                accounts: [],
                data: bs58.encode(limitData),
                programId: ComputeBudgetProgram.programId,
            };

            const results = getTransactionInstructionNames(makeTx([transfer, setLimit]));

            expect(results).toEqual([
                { name: 'Transfer', program: 'System Program' },
                { name: 'Set Compute Unit Limit', program: 'Compute Budget Program' },
            ]);
        });

        it('should return an empty array for a transaction with no instructions', () => {
            expect(getTransactionInstructionNames(makeTx([]))).toEqual([]);
        });
    });
});
