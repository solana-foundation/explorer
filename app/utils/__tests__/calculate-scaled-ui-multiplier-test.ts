import { describe, expect, it } from 'vitest';

import { calculateCurrentTokenScaledUiAmountMultiplier } from '../token-info';

describe('calculateCurrentTokenScaledUiAmountMultiplier', () => {
    it('should calculate multiplier of 1 when raw amount equals ui amount', () => {
        const result = calculateCurrentTokenScaledUiAmountMultiplier({
            amount: '1000000',
            decimals: 6,
            uiAmount: 1,
        });
        expect(result).toBe(1);
    });

    it('should calculate multiplier of 2 when ui amount is double the raw amount', () => {
        const result = calculateCurrentTokenScaledUiAmountMultiplier({
            amount: '1000000',
            decimals: 6,
            uiAmount: 2,
        });
        expect(result).toBe(2);
    });

    it('should handle different decimal places correctly', () => {
        const result = calculateCurrentTokenScaledUiAmountMultiplier({
            amount: '100000000',
            decimals: 8,
            uiAmount: 1,
        });
        expect(result).toBe(1);
    });

    it('should handle fractional multipliers', () => {
        const result = calculateCurrentTokenScaledUiAmountMultiplier({
            amount: '1000000',
            decimals: 6,
            uiAmount: 0.5,
        });
        expect(result).toBe(0.5);
    });

    it('should handle large numbers', () => {
        const result = calculateCurrentTokenScaledUiAmountMultiplier({
            amount: '1000000000000',
            decimals: 12,
            uiAmount: 1,
        });
        expect(result).toBe(1);
    });

    it('should handle small numbers', () => {
        const result = calculateCurrentTokenScaledUiAmountMultiplier({
            amount: '100',
            decimals: 2,
            uiAmount: 1,
        });
        expect(result).toBe(1);
    });
});
