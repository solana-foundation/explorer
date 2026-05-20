import { formatUsdValue } from '@utils/index';

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

    it('should return ~0.00 USD for NaN amount', () => {
        expect(formatUsdValue(NaN, 200)).toBe('~0.00 USD');
    });

    it('should return ~0.00 USD for NaN price', () => {
        expect(formatUsdValue(1, NaN)).toBe('~0.00 USD');
    });

    it('should return ~0.00 USD for negative amount', () => {
        expect(formatUsdValue(-1, 200)).toBe('~0.00 USD');
    });

    it('should return ~0.00 USD for negative price', () => {
        expect(formatUsdValue(1, -200)).toBe('~0.00 USD');
    });
});
