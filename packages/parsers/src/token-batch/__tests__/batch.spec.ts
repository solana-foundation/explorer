import { AccountRole, type AccountMeta, getAddressDecoder } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS, TokenInstruction } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { describe, expect, it } from 'vitest';

import type { KitInstruction } from '../../kit-instruction.js';
import {
    hasTokenBatchDiscriminator,
    isTokenBatchInstruction,
    parseTokenBatchInstruction,
    TOKEN_BATCH_DISCRIMINATOR,
    tokenBatchProgramLabel,
} from '../batch.js';

function testAddress(seed: number) {
    return getAddressDecoder().decode(new Uint8Array(32).fill(seed));
}

function meta(seed: number, role: AccountRole): AccountMeta {
    return { address: testAddress(seed), role };
}

function transferData(amount: number): number[] {
    return [3, amount, 0, 0, 0, 0, 0, 0, 0];
}

function approveData(amount: number): number[] {
    return [4, amount, 0, 0, 0, 0, 0, 0, 0];
}

function batchInstruction(subs: { numAccounts: number; data: number[] }[], accounts: AccountMeta[]): KitInstruction {
    const body = subs.flatMap(sub => [sub.numAccounts, sub.data.length, ...sub.data]);
    return {
        accounts,
        data: new Uint8Array([TOKEN_BATCH_DISCRIMINATOR, ...body]),
        programAddress: TOKEN_2022_PROGRAM_ADDRESS,
    };
}

describe('hasTokenBatchDiscriminator', () => {
    it('should accept data starting with 0xff', () => {
        expect(hasTokenBatchDiscriminator(new Uint8Array([TOKEN_BATCH_DISCRIMINATOR, 1]))).toBe(true);
    });

    it('should reject data with another discriminator', () => {
        expect(hasTokenBatchDiscriminator(new Uint8Array([3, 0, 0]))).toBe(false);
    });

    it('should reject empty data', () => {
        expect(hasTokenBatchDiscriminator(new Uint8Array(0))).toBe(false);
    });
});

describe('tokenBatchProgramLabel', () => {
    it('should label the Token program address', () => {
        expect(tokenBatchProgramLabel(TOKEN_PROGRAM_ADDRESS)).toBe('spl-token');
    });

    it('should label the Token-2022 program address', () => {
        expect(tokenBatchProgramLabel(TOKEN_2022_PROGRAM_ADDRESS)).toBe('spl-token-2022');
    });

    it('should return undefined for any other address', () => {
        expect(tokenBatchProgramLabel(testAddress(1))).toBeUndefined();
    });
});

describe('isTokenBatchInstruction', () => {
    it('should accept a token-program instruction with the batch discriminator', () => {
        expect(
            isTokenBatchInstruction({
                data: new Uint8Array([TOKEN_BATCH_DISCRIMINATOR]),
                programAddress: TOKEN_PROGRAM_ADDRESS,
            }),
        ).toBe(true);
    });

    it('should reject a non-token program even with the batch discriminator', () => {
        expect(
            isTokenBatchInstruction({
                data: new Uint8Array([TOKEN_BATCH_DISCRIMINATOR]),
                programAddress: testAddress(1),
            }),
        ).toBe(false);
    });

    it('should reject a token-program instruction without the batch discriminator', () => {
        expect(
            isTokenBatchInstruction({
                data: new Uint8Array([3, 0, 0]),
                programAddress: TOKEN_2022_PROGRAM_ADDRESS,
            }),
        ).toBe(false);
    });
});

describe('parseTokenBatchInstruction', () => {
    it('should parse a single Transfer sub-instruction without extras', () => {
        const accounts = [
            meta(1, AccountRole.WRITABLE),
            meta(2, AccountRole.WRITABLE),
            meta(3, AccountRole.READONLY_SIGNER),
        ];
        const subs = parseTokenBatchInstruction(
            batchInstruction([{ data: transferData(5), numAccounts: 3 }], accounts),
        );

        expect(subs).toHaveLength(1);
        expect(subs[0].parsed.instructionType).toBe(TokenInstruction.Transfer);
        expect(subs[0].parsed.data).toMatchObject({ amount: 5n });
        expect(subs[0].extraAccounts).toEqual([]);
    });

    it('should slice extra co-signer accounts per sub using accumulated offsets', () => {
        // Transfer: 3 named + 2 co-signers; Approve: 3 named + 1 co-signer.
        const accounts = [
            meta(1, AccountRole.WRITABLE),
            meta(2, AccountRole.WRITABLE),
            meta(3, AccountRole.READONLY),
            meta(4, AccountRole.READONLY_SIGNER),
            meta(5, AccountRole.READONLY_SIGNER),
            meta(6, AccountRole.WRITABLE),
            meta(7, AccountRole.READONLY),
            meta(8, AccountRole.READONLY),
            meta(9, AccountRole.READONLY_SIGNER),
        ];
        const subs = parseTokenBatchInstruction(
            batchInstruction(
                [
                    { data: transferData(1), numAccounts: 5 },
                    { data: approveData(2), numAccounts: 4 },
                ],
                accounts,
            ),
        );

        expect(subs).toHaveLength(2);
        expect(subs[0].extraAccounts).toEqual([accounts[3], accounts[4]]);
        expect(subs[1].parsed.instructionType).toBe(TokenInstruction.Approve);
        expect(subs[1].extraAccounts).toEqual([accounts[8]]);
    });

    it('should treat a nested batch sub-instruction as having no named accounts', () => {
        const accounts = [
            meta(1, AccountRole.WRITABLE),
            meta(2, AccountRole.WRITABLE),
            meta(3, AccountRole.READONLY_SIGNER),
        ];
        const nested = [TOKEN_BATCH_DISCRIMINATOR, 3, 9, ...transferData(1)];
        const subs = parseTokenBatchInstruction(
            batchInstruction(
                [
                    { data: nested, numAccounts: 0 },
                    { data: transferData(7), numAccounts: 3 },
                ],
                accounts,
            ),
        );

        expect(subs).toHaveLength(2);
        expect(subs[0].parsed.instructionType).toBe(TokenInstruction.Batch);
        expect(subs[0].extraAccounts).toEqual([]);
        expect(subs[1].parsed.instructionType).toBe(TokenInstruction.Transfer);
        expect(subs[1].extraAccounts).toEqual([]);
    });

    it('should return an empty list for an empty batch', () => {
        expect(parseTokenBatchInstruction(batchInstruction([], []))).toEqual([]);
    });
});
