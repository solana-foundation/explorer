import { getBase58Decoder } from '@solana/kit';
import {
    ComputeBudgetProgram,
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';

import type { TransactionWithMeta } from '../../model/types';
import { getInstructionSummaries, resolveInstructionNames, resolveNamesFromData } from '../instruction-summary';

const BASE58_DECODER = getBase58Decoder();

describe('getInstructionSummaries', () => {
    describe('parsed instructions', () => {
        it('should convert a simple camelCase type to title case', () => {
            const ix = {
                parsed: { info: {}, type: 'transfer' },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({ name: 'Transfer', programName: 'System Program' });
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

            expect(result).toEqual({ name: 'Memo', programName: 'Memo Program' });
        });

        it('should return Unknown Instruction when parsed is an object without a type field', () => {
            const ix = {
                parsed: { info: {} },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({ name: 'Unknown Instruction', programName: 'System Program' });
        });
    });

    describe('unknown / partially decoded instructions', () => {
        it('should attach the program + discriminator as a coupled nameLookup alongside the placeholder', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: BASE58_DECODER.decode(new Uint8Array([1, 2, 3])),
                programId: SystemProgram.programId,
            };

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({
                name: 'Unknown Instruction',
                nameLookup: {
                    data: new Uint8Array([1, 2, 3]),
                    programId: SystemProgram.programId.toBase58(),
                },
                programName: 'System Program',
            });
        });

        it('should cap the discriminator lookup at the leading 16 bytes', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: BASE58_DECODER.decode(
                    new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
                ),
                programId: SystemProgram.programId,
            };

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result.nameLookup?.data).toEqual(
                new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
            );
        });
    });

    describe('ZK ElGamal proof instructions', () => {
        const ZK_ELGAMAL_PROOF_PROGRAM_ID = new PublicKey('ZkE1Gama1Proof11111111111111111111111111111');

        // Program-specific naming is no longer baked in here — a ZK ElGamal instruction is emitted as a
        // generic unparsed instruction (Unknown + nameLookup) and named downstream by a resolver.
        it('should defer naming to a resolver via the program + discriminator lookup', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: BASE58_DECODER.decode(new Uint8Array([3])),
                programId: ZK_ELGAMAL_PROOF_PROGRAM_ID,
            };

            const [result] = getInstructionSummaries(makeTx([ix]));

            expect(result).toEqual({
                name: 'Unknown Instruction',
                nameLookup: {
                    data: new Uint8Array([3]),
                    programId: ZK_ELGAMAL_PROOF_PROGRAM_ID.toBase58(),
                },
                programName: 'ZK ElGamal Proof Program',
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
                data: BASE58_DECODER.decode(limitData),
                programId: ComputeBudgetProgram.programId,
            };

            const results = getInstructionSummaries(makeTx([transfer, setLimit]));

            expect(results).toEqual([{ name: 'Transfer', programName: 'System Program' }]);
        });

        it('should return an empty array for a transaction with no instructions', () => {
            expect(getInstructionSummaries(makeTx([]))).toEqual([]);
        });
    });

    describe('transaction versions', () => {
        it('should accept a v1 transaction as the kit fetch returns it', () => {
            const ix = {
                parsed: { info: {}, type: 'transfer' },
                program: 'system',
                programId: SystemProgram.programId,
            } as unknown as ParsedInstruction;
            const version = 1;
            const results = getInstructionSummaries(makeTxWithMeta([ix], version));

            expect(results).toEqual([{ name: 'Transfer', programName: 'System Program' }]);
        });
    });
});

describe('resolveInstructionNames', () => {
    describe('positive cases: names resolvable from the transaction alone', () => {
        it('should name a parsed instruction from its type', () => {
            const ix = {
                parsed: { info: {}, type: 'transferChecked' },
                program: 'spl-token',
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            } as unknown as ParsedInstruction;

            expect(resolveInstructionNames(ix)).toEqual({
                name: 'Transfer Checked',
                programName: 'Token Program',
            });
        });
    });

    describe('negative cases: nothing names the instruction', () => {
        it('should leave the name unset and emit a nameLookup for an unparsed instruction', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: BASE58_DECODER.decode(new Uint8Array([1, 2, 3])),
                programId: SystemProgram.programId,
            };

            expect(resolveInstructionNames(ix)).toEqual({
                nameLookup: {
                    data: new Uint8Array([1, 2, 3]),
                    programId: SystemProgram.programId.toBase58(),
                },
                programName: 'System Program',
            });
        });

        it('should leave both names unset for an unnamed program', () => {
            const ix: PartiallyDecodedInstruction = {
                accounts: [],
                data: BASE58_DECODER.decode(new Uint8Array([7])),
                programId: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
            };

            const { name, programName } = resolveInstructionNames(ix);

            expect(name).toBeUndefined();
            expect(programName).toBeUndefined();
        });
    });
});

describe('resolveNamesFromData', () => {
    describe('positive cases: names resolvable from raw data', () => {
        // Every byte-level resolver is a NAME_SOURCES entry, so this stage only names the program.
        it('should name the program and emit a lookup for a Compute Budget instruction', () => {
            const names = resolveNamesFromData({
                data: new Uint8Array([2, 0x40, 0x0d, 0x03, 0x00]),
                programId: ComputeBudgetProgram.programId,
            });

            expect(names).toEqual({
                name: undefined,
                nameLookup: {
                    data: new Uint8Array([2, 0x40, 0x0d, 0x03, 0x00]),
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
                programName: 'Compute Budget Program',
            });
        });

        it('should cap the discriminator lookup at the leading 16 bytes', () => {
            const names = resolveNamesFromData({
                data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
                programId: SystemProgram.programId,
            });

            expect(names.nameLookup?.data).toEqual(
                new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
            );
        });
    });

    describe('negative cases: nothing names the instruction', () => {
        // A simulated System transfer reaches here: there is no RPC parse to read a type from, and
        // System ships no IDL, so only the program is named. The CU chart falls back to the position.
        it('should name only the program for a built-in with no name source', () => {
            const names = resolveNamesFromData({
                data: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0]),
                programId: SystemProgram.programId,
            });

            expect(names.name).toBeUndefined();
            expect(names.programName).toBe('System Program');
        });

        it('should leave both names unset for empty data on an unnamed program', () => {
            const names = resolveNamesFromData({
                data: new Uint8Array(),
                programId: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
            });

            expect(names.name).toBeUndefined();
            expect(names.programName).toBeUndefined();
        });
    });
});

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

function makeTxWithMeta(
    instructions: (ParsedInstruction | PartiallyDecodedInstruction)[],
    version: TransactionWithMeta['version'],
): TransactionWithMeta {
    return {
        meta: null,
        transaction: {
            message: {
                accountKeys: [],
                instructions,
            },
            signatures: [],
        },
        version,
    } as unknown as TransactionWithMeta;
}
