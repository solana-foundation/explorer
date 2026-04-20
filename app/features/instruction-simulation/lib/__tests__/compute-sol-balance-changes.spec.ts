import type { AccountInfo, ParsedAccountData, SimulatedTransactionAccountInfo } from '@solana/web3.js';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import BN from 'bn.js';
import { describe, expect, it } from 'vitest';

import { computeSolBalanceChanges } from '../compute-sol-balance-changes';

const KEY_A = Keypair.generate().publicKey;
const KEY_B = Keypair.generate().publicKey;
const KEY_C = Keypair.generate().publicKey;

describe('computeSolBalanceChanges', () => {
    it('should compute a positive delta when an account gains lamports', () => {
        const result = computeSolBalanceChanges([KEY_A], [preAccount(1_000_000)], [postAccount(2_000_000)]);

        expect(result).toHaveLength(1);
        expect(result[0].pubkey).toBe(KEY_A);
        expect(result[0].delta.eq(new BN(1_000_000))).toBe(true);
        expect(result[0].preBalance.eq(new BN(1_000_000))).toBe(true);
        expect(result[0].postBalance.eq(new BN(2_000_000))).toBe(true);
    });

    it('should compute a negative delta when an account loses lamports', () => {
        const result = computeSolBalanceChanges([KEY_A], [preAccount(5_000_000)], [postAccount(3_000_000)]);

        expect(result).toHaveLength(1);
        expect(result[0].delta.eq(new BN(-2_000_000))).toBe(true);
    });

    it('should skip accounts with zero delta', () => {
        const result = computeSolBalanceChanges([KEY_A], [preAccount(1_000_000)], [postAccount(1_000_000)]);

        expect(result).toEqual([]);
    });

    it('should handle multiple accounts with mixed deltas', () => {
        const result = computeSolBalanceChanges(
            [KEY_A, KEY_B, KEY_C],
            [preAccount(100), preAccount(200), preAccount(300)],
            [postAccount(150), postAccount(200), postAccount(250)],
        );

        // KEY_B has zero delta and should be excluded
        expect(result).toHaveLength(2);
        expect(result[0].pubkey).toBe(KEY_A);
        expect(result[0].delta.eq(new BN(50))).toBe(true);
        expect(result[1].pubkey).toBe(KEY_C);
        expect(result[1].delta.eq(new BN(-50))).toBe(true);
    });

    it('should return an empty array when given no accounts', () => {
        const result = computeSolBalanceChanges([], [], []);

        expect(result).toEqual([]);
    });

    it('should treat undefined pre-simulation accounts as 0 lamports', () => {
        const result = computeSolBalanceChanges([KEY_A], [undefined], [postAccount(500_000)]);

        expect(result).toHaveLength(1);
        expect(result[0].preBalance.eq(new BN(0))).toBe(true);
        expect(result[0].postBalance.eq(new BN(500_000))).toBe(true);
        expect(result[0].delta.eq(new BN(500_000))).toBe(true);
    });

    it('should treat undefined post-simulation accounts as 0 lamports', () => {
        const result = computeSolBalanceChanges([KEY_A], [preAccount(300_000)], [undefined]);

        expect(result).toHaveLength(1);
        expect(result[0].delta.eq(new BN(-300_000))).toBe(true);
    });

    describe('with knownBalances', () => {
        it('should use knownBalances instead of simulated data', () => {
            const result = computeSolBalanceChanges(
                [KEY_A],
                [preAccount(999)], // should be ignored
                [postAccount(999)], // should be ignored
                { postBalances: [2_000], preBalances: [1_000] },
            );

            expect(result).toHaveLength(1);
            expect(result[0].preBalance.eq(new BN(1_000))).toBe(true);
            expect(result[0].postBalance.eq(new BN(2_000))).toBe(true);
            expect(result[0].delta.eq(new BN(1_000))).toBe(true);
        });

        it('should skip accounts with zero delta from knownBalances', () => {
            const result = computeSolBalanceChanges([KEY_A], [preAccount(0)], [postAccount(0)], {
                postBalances: [500],
                preBalances: [500],
            });

            expect(result).toEqual([]);
        });

        it('should handle missing entries in knownBalances as 0', () => {
            const result = computeSolBalanceChanges(
                [KEY_A, KEY_B],
                [preAccount(0), preAccount(0)],
                [postAccount(0), postAccount(0)],
                // Only one entry — KEY_B index is out of bounds
                { postBalances: [200], preBalances: [100] },
            );

            // KEY_A: 200 - 100 = 100
            // KEY_B: 0 - 0 = 0 (undefined falls back to ?? 0)
            expect(result).toHaveLength(1);
            expect(result[0].pubkey).toBe(KEY_A);
            expect(result[0].delta.eq(new BN(100))).toBe(true);
        });
    });
});

function preAccount(lamports: number): AccountInfo<ParsedAccountData | Buffer> {
    return {
        data: { parsed: { info: {}, type: 'account' }, program: 'system', space: 0 },
        executable: false,
        lamports,
        owner: new PublicKey(SYSTEM_PROGRAM_ADDRESS),
        rentEpoch: 0,
    };
}

function postAccount(lamports: number): SimulatedTransactionAccountInfo {
    return {
        data: ['', 'base64'],
        executable: false,
        lamports,
        owner: SYSTEM_PROGRAM_ADDRESS,
        rentEpoch: 0,
    };
}
