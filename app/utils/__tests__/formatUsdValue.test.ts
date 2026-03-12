import { formatUsdValue } from '@utils/index';

describe('formatUsdValue', () => {
    it('formats a normal value', () => {
        expect(formatUsdValue(1, 200)).toBe('$200.00');
    });

    it('formats fractional result with 2 decimal places', () => {
        expect(formatUsdValue(0.5, 3)).toBe('$1.50');
    });

    it('adds thousands separator', () => {
        expect(formatUsdValue(10, 1000)).toBe('$10,000.00');
    });

    it('returns $0.00 for zero amount', () => {
        expect(formatUsdValue(0, 200)).toBe('$0.00');
    });

    it('returns $0.00 for zero price', () => {
        expect(formatUsdValue(1, 0)).toBe('$0.00');
    });

    it('returns $0.00 for NaN amount', () => {
        expect(formatUsdValue(NaN, 200)).toBe('$0.00');
    });

    it('returns $0.00 for NaN price', () => {
        expect(formatUsdValue(1, NaN)).toBe('$0.00');
    });

    it('returns $0.00 for negative amount', () => {
        expect(formatUsdValue(-1, 200)).toBe('$0.00');
    });

    it('returns $0.00 for negative price', () => {
        expect(formatUsdValue(1, -200)).toBe('$0.00');
    });
});
