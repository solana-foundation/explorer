import { Address } from '@solana/kit';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getCreateAccountWithSeedInstructionDataEncoder } from '@solana-program/system';
import { describe, expect, test } from 'vitest';

import { parseSystemProgramInstruction } from '../system-program.parser';

/** Helper to encode CreateAccountWithSeed instruction data using @solana-program/system */
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

describe('parseSystemProgramInstruction', () => {
    describe('CreateAccountWithSeed', () => {
        const payer = new PublicKey('5beFUXg6tj7as2rVSvr39MsTQChSsyBNy13j8Em3ZMVV');
        const newAccount = new PublicKey('HGZxAm97YjZN2Ea8kk4zNv87fGYnUmEDphTiN9pVVRf1');
        const baseAccount = new PublicKey('Base4feziQk7rNDM1GfCnU6BMAUQiY7MBtJ7qctugFJp');
        const tokenProgram = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const seed = 'test-seed';
        const lamports = 2100000;
        const space = 165;

        test('parses 3-account variant (payer !== baseAccount)', () => {
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

            const result = parseSystemProgramInstruction(instruction);

            expect(result).not.toBeNull();
            expect(result!.type).toBe('createAccountWithSeed');
            expect(result!.info.source.equals(payer)).toBe(true);
            expect(result!.info.newAccount.equals(newAccount)).toBe(true);
            expect(result!.info.base.equals(baseAccount)).toBe(true);
            expect(result!.info.seed).toBe(seed);
            expect(result!.info.lamports).toBe(lamports);
            expect(result!.info.space).toBe(space);
            expect(result!.info.owner.equals(tokenProgram)).toBe(true);
        });

        test('parses 2-account variant (payer === baseAccount)', () => {
            // Create instruction with 2 accounts: payer (who is also baseAccount), newAccount
            // This is the case that was causing the "Not enough accounts" error
            const instruction = new TransactionInstruction({
                data: createCreateAccountWithSeedData({
                    base: payer,
                    lamports,

                    programId: tokenProgram,
                    // base is the same as payer
                    seed,
                    space,
                }),
                keys: [
                    { isSigner: true, isWritable: true, pubkey: payer },
                    { isSigner: false, isWritable: true, pubkey: newAccount },
                    // Note: no third account - baseAccount is omitted because payer === baseAccount
                ],
                programId: SystemProgram.programId,
            });

            const result = parseSystemProgramInstruction(instruction);

            expect(result).not.toBeNull();
            expect(result!.type).toBe('createAccountWithSeed');
            expect(result!.info.source.equals(payer)).toBe(true);
            expect(result!.info.newAccount.equals(newAccount)).toBe(true);
            // Base should be extracted from instruction data, not accounts
            expect(result!.info.base.equals(payer)).toBe(true);
            expect(result!.info.seed).toBe(seed);
            expect(result!.info.lamports).toBe(lamports);
            expect(result!.info.space).toBe(space);
            expect(result!.info.owner.equals(tokenProgram)).toBe(true);
        });

        test('handles different seed lengths correctly', () => {
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

            const result = parseSystemProgramInstruction(instruction);

            expect(result).not.toBeNull();
            expect(result!.info.seed).toBe(longSeed);
        });

        test('returns null for non-System Program instructions', () => {
            const instruction = new TransactionInstruction({
                // Not System Program
                data: Buffer.from([0, 0, 0, 0]),

                keys: [],
                programId: tokenProgram,
            });

            const result = parseSystemProgramInstruction(instruction);

            expect(result).toBeNull();
        });

        test('returns null for unrecognized System Program instructions', () => {
            const instruction = new TransactionInstruction({
                data: Buffer.from([255, 255, 255, 255]),
                keys: [],
                programId: SystemProgram.programId, // Invalid discriminator
            });

            const result = parseSystemProgramInstruction(instruction);

            expect(result).toBeNull();
        });
    });
});
