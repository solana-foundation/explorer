import {
    ComputeBudgetProgram,
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';
import bs58 from 'bs58';

import { getInstructionSummaries } from '../instruction-summary';

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

describe('getInstructionSummaries', () => {
    describe('parsed instructions', () => {
        it('should convert a simple camelCase type to title case', () => {
            const ix = {
                parsed: { info: {}, type: 'transfer' },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({ name: 'Transfer', program: 'System Program' });
        });

        it('should convert a multi-word camelCase type to title case', () => {
            const ix = {
                parsed: { info: {}, type: 'initializeAccount' },
                program: 'spl-token',
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            } as unknown as ParsedInstruction;

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result.name).toBe('Initialize Account');
        });

        it('should return Memo when parsed is a string (e.g. memo text)', () => {
            const ix = {
                parsed: 'test',
                program: 'spl-memo',
                programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            } as unknown as ParsedInstruction;

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({ name: 'Memo', program: 'Memo Program' });
        });

        it('should return Unknown Instruction when parsed is an object without a type field', () => {
            const ix = {
                parsed: { info: {} },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({ name: 'Unknown Instruction', program: 'System Program' });
        });
    });

    describe('unknown / partially decoded instructions', () => {
        it('should attach the program + discriminator as a coupled nameLookup hint alongside the placeholder', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: bs58.encode(new Uint8Array([1, 2, 3])),
                programId: SystemProgram.programId,
            };

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({
                name: 'Unknown Instruction',
                nameLookup: {
                    discriminator: new Uint8Array([1, 2, 3]),
                    programId: SystemProgram.programId.toBase58(),
                },
                program: 'System Program',
            });
        });

        it('should cap the discriminator hint at the leading 16 bytes', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: bs58.encode(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])),
                programId: SystemProgram.programId,
            };

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result.nameLookup?.discriminator).toEqual(
                new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
            );
        });
    });

    describe('ZK ElGamal proof instructions', () => {
        const ZK_ELGAMAL_PROOF_PROGRAM_ID = new PublicKey('ZkE1Gama1Proof11111111111111111111111111111');

        // Program-specific naming is no longer baked in here — a ZK ElGamal instruction is emitted as a
        // generic unparsed instruction (Unknown + nameLookup) and named downstream by a resolver.
        it('should defer naming to a resolver via the program + discriminator hint', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: bs58.encode(new Uint8Array([3])),
                programId: ZK_ELGAMAL_PROOF_PROGRAM_ID,
            };

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({
                name: 'Unknown Instruction',
                nameLookup: {
                    discriminator: new Uint8Array([3]),
                    programId: ZK_ELGAMAL_PROOF_PROGRAM_ID.toBase58(),
                },
                program: 'ZK ElGamal Proof Program',
            });
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

            const results = getInstructionSummaries(makeTx([transfer, setLimit]));

            expect(results).toEqual([{ name: 'Transfer', program: 'System Program' }]);
        });

        it('should return an empty array for a transaction with no instructions', () => {
            expect(getInstructionSummaries(makeTx([]))).toEqual([]);
        });
    });
});
