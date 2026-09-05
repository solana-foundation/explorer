import { describe, expect, it } from 'vitest';

import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../../shared/constants.js';
import { toTokenUiAmount } from '../token-ui-amount.js';

describe('toTokenUiAmount', () => {
    it('should shift a token amount by its declared decimals', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 100_000n, decimals: 6 })).toBe('0.1');
    });

    it('should keep whole amounts without a fractional part', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 2_000_000n, decimals: 6 })).toBe('2');
    });

    it('should trim only trailing fractional zeros', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 1_010_000n, decimals: 6 })).toBe('1.01');
    });

    it('should return the amount unchanged for a zero-decimal mint', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 42n, decimals: 0 })).toBe('42');
    });

    it('should stay exact beyond the safe-integer range', () => {
        expect(toTokenUiAmount(TOKEN_2022_PROGRAM_ID, { amount: 18_446_744_073_709_551_615n, decimals: 9 })).toBe(
            '18446744073.709551615',
        );
    });

    it('should accept a stringified u64 from a swapped decode engine', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: '100000', decimals: 6 })).toBe('0.1');
    });

    it('should ignore programs other than the two token programs', () => {
        expect(toTokenUiAmount('11111111111111111111111111111111', { amount: 100_000n, decimals: 6 })).toBeUndefined();
    });

    it('should ignore a decode carrying no decimals', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 100_000n })).toBeUndefined();
    });

    it('should ignore a decode carrying no amount', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { decimals: 6 })).toBeUndefined();
    });

    it('should ignore a non-object payload', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, undefined)).toBeUndefined();
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, null)).toBeUndefined();
    });

    it('should ignore decimals that are not a whole count', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 100_000n, decimals: 1.5 })).toBeUndefined();
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 100_000n, decimals: -1 })).toBeUndefined();
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 100_000n, decimals: '6' })).toBeUndefined();
    });

    it('should ignore an amount that is not an unsigned integer', () => {
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: 1.5, decimals: 6 })).toBeUndefined();
        expect(toTokenUiAmount(TOKEN_PROGRAM_ID, { amount: '-100', decimals: 6 })).toBeUndefined();
    });
});
