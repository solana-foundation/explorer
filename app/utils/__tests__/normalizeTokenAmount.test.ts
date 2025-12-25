import { normalizeTokenAmount } from '@utils/index';

describe('normalizeTokenAmount', () => {
    it('should handle 0 decimals', () => {
        expect(normalizeTokenAmount(100, 0)).toBe(100);
        expect(normalizeTokenAmount('100', 0)).toBe(100);
    });

    it('should handle 6 decimals (USDC)', () => {
        expect(normalizeTokenAmount(1000000, 6)).toBe(1);
        expect(normalizeTokenAmount('1000000', 6)).toBe(1);
        expect(normalizeTokenAmount(1500000, 6)).toBe(1.5);
        expect(normalizeTokenAmount('1500000', 6)).toBe(1.5);
    });

    it('should handle 9 decimals (SOL-like)', () => {
        expect(normalizeTokenAmount(1000000000, 9)).toBe(1);
        expect(normalizeTokenAmount('1000000000', 9)).toBe(1);
        expect(normalizeTokenAmount(1234567890, 9)).toBe(1.23456789);
    });

    it('should handle 0 amount', () => {
        expect(normalizeTokenAmount(0, 6)).toBe(0);
        expect(normalizeTokenAmount('0', 6)).toBe(0);
        expect(normalizeTokenAmount(0, 0)).toBe(0);
    });

    it('should handle small amounts', () => {
        expect(normalizeTokenAmount(1, 6)).toBe(0.000001);
        expect(normalizeTokenAmount('1', 9)).toBe(0.000000001);
    });

    it('should handle large amounts', () => {
        expect(normalizeTokenAmount(1000000000000, 6)).toBe(1000000);
        expect(normalizeTokenAmount('1000000000000000', 6)).toBe(1000000000);
    });
});
