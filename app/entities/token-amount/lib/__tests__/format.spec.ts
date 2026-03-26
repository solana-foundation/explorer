import { describe, expect, it } from 'vitest';

import { formatTokenAmount, tokenAmountToFiat, tokenAmountToNumber } from '../format';

describe('formatTokenAmount', () => {
    it.each([
        // wSOL (9 decimals)
        { amount: 1_000_000_000n, decimals: 9, expected: '1', label: 'wSOL: 1 SOL' },
        { amount: 1_500_000_000n, decimals: 9, expected: '1.5', label: 'wSOL: 1.5 SOL' },
        { amount: 1n, decimals: 9, expected: '0.000000001', label: 'wSOL: smallest unit (1 lamport)' },
        // USDC (6 decimals)
        { amount: 1_000_000n, decimals: 6, expected: '1', label: 'USDC: 1.0' },
        { amount: 1_500_000n, decimals: 6, expected: '1.5', label: 'USDC: 1.5' },
        { amount: 1n, decimals: 6, expected: '0.000001', label: 'USDC: smallest unit' },
        { amount: 100n, decimals: 6, expected: '0.0001', label: 'USDC: 0.0001' },
        // Edge cases
        { amount: 42n, decimals: 0, expected: '42', label: 'zero-decimal token' },
        { amount: 0n, decimals: 6, expected: '0', label: 'zero amount' },
    ])('should format $label → $expected', ({ amount, decimals, expected }) => {
        expect(formatTokenAmount({ amount, decimals })).toBe(expected);
    });

    it('should produce different results for same raw amount with different decimals', () => {
        const raw = 1_000_000n;
        expect(formatTokenAmount({ amount: raw, decimals: 6 })).toBe('1');
        expect(formatTokenAmount({ amount: raw, decimals: 9 })).toBe('0.001');
    });
});

describe('tokenAmountToNumber', () => {
    it.each([
        { amount: 1_500_000_000n, decimals: 9, expected: 1.5, label: 'wSOL: 1.5 SOL' },
        { amount: 1_000_000n, decimals: 6, expected: 1, label: 'USDC: 1.0' },
        { amount: 42n, decimals: 0, expected: 42, label: 'zero-decimal token' },
        { amount: 0n, decimals: 6, expected: 0, label: 'zero amount' },
    ])('should convert $label → $expected', ({ amount, decimals, expected }) => {
        expect(tokenAmountToNumber({ amount, decimals })).toBe(expected);
    });

    it('should produce different results for same raw amount with different decimals', () => {
        const raw = 1_000_000n;
        expect(tokenAmountToNumber({ amount: raw, decimals: 6 })).toBe(1);
        expect(tokenAmountToNumber({ amount: raw, decimals: 9 })).toBe(0.001);
    });
});

describe('tokenAmountToFiat', () => {
    it.each([
        // 1.5 SOL at $150/SOL = $225
        { amount: 1_500_000_000n, decimals: 9, price: 150, expected: 225, label: 'wSOL at 150' },
        // 1 USDC at $1/USDC = $1
        { amount: 1_000_000n, decimals: 6, price: 1, expected: 1, label: 'USDC at 1' },
        // 0.5 USDC at $1/USDC = $0.5
        { amount: 500_000n, decimals: 6, price: 1, expected: 0.5, label: 'USDC at 1 (half)' },
    ])('should convert $label → $expected', ({ amount, decimals, price, expected }) => {
        expect(tokenAmountToFiat({ amount, decimals }, price)).toBe(expected);
    });

    it('should apply decimals before price — not multiply raw amount', () => {
        // The bug: 1_500_000_000 * 150 = 225_000_000_000 (wrong)
        // Correct:  1.5 * 150 = 225
        const sol = { amount: 1_500_000_000n, decimals: 9 };
        expect(tokenAmountToFiat(sol, 150)).toBe(225);
        expect(Number(sol.amount) * 150).toBe(225_000_000_000); // raw multiplication is wrong
    });
});
