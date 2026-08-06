import { describe, expect, it } from 'vitest';

import { deriveScaledUiAmountMultiplier } from '../derive-scaled-ui-multiplier';

describe('deriveScaledUiAmountMultiplier', () => {
    it('should return 1 for an unscaled balance', () => {
        // 10000000 / 10^6 = 10, uiAmount 10 -> multiplier 1
        expect(deriveScaledUiAmountMultiplier('10000000', 6, '10')).toBe('1');
    });

    it('should derive a 2x multiplier from a pre-scaled uiAmount', () => {
        // 10000000 / 10^6 = 10, uiAmount 20 -> multiplier 2 (matches the official docs example)
        expect(deriveScaledUiAmountMultiplier('10000000', 6, '20')).toBe('2');
    });

    it('should derive a fractional multiplier', () => {
        // 1000000 / 10^6 = 1, uiAmount 1.5 -> multiplier 1.5
        expect(deriveScaledUiAmountMultiplier('1000000', 6, '1.5')).toBe('1.5');
    });

    it('should handle zero decimals', () => {
        expect(deriveScaledUiAmountMultiplier('5', 0, '10')).toBe('2');
    });

    it('should return 1 when rawAmount is zero', () => {
        expect(deriveScaledUiAmountMultiplier('0', 6, '0')).toBe('1');
    });

    it('should round away floating point noise to a clean multiplier', () => {
        expect(deriveScaledUiAmountMultiplier('3', 0, '5.9999998')).toBe('2');
    });
});
