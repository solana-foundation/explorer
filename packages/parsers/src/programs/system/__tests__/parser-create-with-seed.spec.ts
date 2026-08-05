import { type Address } from '@solana/kit';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getCreateAccountWithSeedInstructionDataEncoder } from '@solana-program/system';
import { describe, expect, it } from 'vitest';

import { toKitInstruction } from '../../../compat/web3js.js';
import { parseSystemInstruction } from '../parser.js';
import type { CreateAccountWithSeedInfo } from '../validators.js';

// Local copy of the app's invariant helper — the package carries no app imports.
function invariant(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

function createCreateAccountWithSeedData(params: {
    base: PublicKey;
    seed: string;
    lamports: number;
    space: number;
    programId: PublicKey;
}): Buffer {
    const encoder = getCreateAccountWithSeedInstructionDataEncoder();
    const data = encoder.encode({
        amount: params.lamports,
        base: params.base.toBase58() as Address,
        programAddress: params.programId.toBase58() as Address,
        seed: params.seed,
        space: params.space,
    });
    return Buffer.from(data);
}

function infoAsCreateAccountWithSeed(value: unknown): CreateAccountWithSeedInfo {
    return value as CreateAccountWithSeedInfo;
}

describe('parseSystemInstruction', () => {
    describe('CreateAccountWithSeed', () => {
        const payer = new PublicKey('5beFUXg6tj7as2rVSvr39MsTQChSsyBNy13j8Em3ZMVV');
        const newAccount = new PublicKey('HGZxAm97YjZN2Ea8kk4zNv87fGYnUmEDphTiN9pVVRf1');
        const baseAccount = new PublicKey('Base4feziQk7rNDM1GfCnU6BMAUQiY7MBtJ7qctugFJp');
        const tokenProgram = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const seed = 'test-seed';
        const lamports = 2100000;
        const space = 165;

        it('should parse 3-account variant (payer !== baseAccount)', () => {
            // Create instruction with 3 accounts: payer, newAccount, baseAccount
            const instruction = new TransactionInstruction({
                data: createCreateAccountWithSeedData({
                    base: baseAccount,
                    lamports,
                    programId: tokenProgram,
                    seed,
                    space,
                }),
                keys: [
                    { isSigner: true, isWritable: true, pubkey: payer },
                    { isSigner: false, isWritable: true, pubkey: newAccount },
                    { isSigner: true, isWritable: false, pubkey: baseAccount },
                ],
                programId: SystemProgram.programId,
            });

            const result = parseSystemInstruction(toKitInstruction(instruction));

            invariant(result, 'expected parser to return an instruction for a valid CreateAccountWithSeed payload');
            expect(result.type).toBe('createAccountWithSeed');
            const info = infoAsCreateAccountWithSeed(result.info);
            expect(info.source.equals(payer)).toBe(true);
            expect(info.newAccount.equals(newAccount)).toBe(true);
            expect(info.base.equals(baseAccount)).toBe(true);
            expect(info.seed).toBe(seed);
            expect(info.lamports).toBe(lamports);
            expect(info.space).toBe(space);
            expect(info.owner.equals(tokenProgram)).toBe(true);
        });

        it('should parse 2-account variant (payer === baseAccount)', () => {
            // payer === baseAccount: the 3rd account is omitted and the
            // base address must be recovered from instruction data.
            const instruction = new TransactionInstruction({
                data: createCreateAccountWithSeedData({
                    base: payer,
                    lamports,
                    programId: tokenProgram,
                    seed,
                    space,
                }),
                keys: [
                    { isSigner: true, isWritable: true, pubkey: payer },
                    { isSigner: false, isWritable: true, pubkey: newAccount },
                ],
                programId: SystemProgram.programId,
            });

            const result = parseSystemInstruction(toKitInstruction(instruction));

            invariant(
                result,
                'expected parser to return an instruction for a valid 2-account CreateAccountWithSeed payload',
            );
            expect(result.type).toBe('createAccountWithSeed');
            const info = infoAsCreateAccountWithSeed(result.info);
            expect(info.source.equals(payer)).toBe(true);
            expect(info.newAccount.equals(newAccount)).toBe(true);
            expect(info.base.equals(payer)).toBe(true);
            expect(info.seed).toBe(seed);
            expect(info.lamports).toBe(lamports);
            expect(info.space).toBe(space);
            expect(info.owner.equals(tokenProgram)).toBe(true);
        });

        it('should handle different seed lengths correctly', () => {
            const longSeed = 'this-is-a-very-long-seed-for-testing-purposes';

            const instruction = new TransactionInstruction({
                data: createCreateAccountWithSeedData({
                    base: payer,
                    lamports,
                    programId: tokenProgram,
                    seed: longSeed,
                    space,
                }),
                keys: [
                    { isSigner: true, isWritable: true, pubkey: payer },
                    { isSigner: false, isWritable: true, pubkey: newAccount },
                ],
                programId: SystemProgram.programId,
            });

            const result = parseSystemInstruction(toKitInstruction(instruction));

            invariant(result, 'expected parser to return an instruction when seed is long');
            expect(infoAsCreateAccountWithSeed(result.info).seed).toBe(longSeed);
        });

        it('should return undefined when a recognised discriminator has too few accounts', () => {
            const instruction = new TransactionInstruction({
                data: Buffer.from([0, 0, 0, 0]),
                keys: [],
                programId: SystemProgram.programId,
            });

            const result = parseSystemInstruction(toKitInstruction(instruction));

            expect(result).toBeUndefined();
        });

        it('should return undefined for unrecognised System Program instructions', () => {
            const instruction = new TransactionInstruction({
                data: Buffer.from([255, 255, 255, 255]),
                keys: [],
                programId: SystemProgram.programId,
            });

            const result = parseSystemInstruction(toKitInstruction(instruction));

            expect(result).toBeUndefined();
        });
    });
});
