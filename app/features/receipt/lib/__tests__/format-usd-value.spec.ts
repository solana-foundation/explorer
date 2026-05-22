import { formatUsdValue, USD_FALLBACK } from '../parse-usd';

describe('formatUsdValue', () => {
    it('should format a normal value', () => {
        expect(formatUsdValue(1, 200)).toBe('~200.00 USD');
    });

    it('should format fractional result with 2 decimal places', () => {
        expect(formatUsdValue(0.5, 3)).toBe('~1.50 USD');
    });

    it('should add thousands separator', () => {
        expect(formatUsdValue(10, 1000)).toBe('~10,000.00 USD');
    });

    it('should return ~0.00 USD for zero amount', () => {
        expect(formatUsdValue(0, 200)).toBe('~0.00 USD');
    });

    it('should return ~0.00 USD for zero price', () => {
        expect(formatUsdValue(1, 0)).toBe('~0.00 USD');
    });

    it('should return null for NaN amount', () => {
        expect(formatUsdValue(NaN, 200)).toBeNull();
    });

    it('should return null for NaN price', () => {
        expect(formatUsdValue(1, NaN)).toBeNull();
    });

    it('should return null for negative amount', () => {
        expect(formatUsdValue(-1, 200)).toBeNull();
    });

    it('should return null for negative price', () => {
        expect(formatUsdValue(1, -200)).toBeNull();
    });

    it('should return null when amount × price overflows to Infinity', () => {
        expect(formatUsdValue(Number.MAX_VALUE, Number.MAX_VALUE)).toBeNull();
    });

    it('should return null for Infinity amount', () => {
        expect(formatUsdValue(Infinity, 1)).toBeNull();
    });

    it('should return null for -Infinity amount', () => {
        expect(formatUsdValue(-Infinity, 1)).toBeNull();
    });

    it('should return the orFallback override for invalid input', () => {
        expect(formatUsdValue(NaN, 200, USD_FALLBACK)).toBe('~0.00 USD');
    });

    it('should accept a custom orFallback string', () => {
        expect(formatUsdValue(NaN, 200, '—')).toBe('—');
    });

    it('should ignore orFallback for valid input', () => {
        expect(formatUsdValue(1, 200, 'UNUSED')).toBe('~200.00 USD');
    });
});
