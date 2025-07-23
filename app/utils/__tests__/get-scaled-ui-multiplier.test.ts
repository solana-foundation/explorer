import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenExtension } from '../../validators/accounts/token-extension';
import { getCurrentTokenScaledUiAmountMultiplier } from '../token-info';

describe('getCurrentTokenScaledUiAmountMultiplier', () => {
    let originalDateNow: () => number;

    beforeEach(() => {
        // Store the original Date.now
        originalDateNow = Date.now;
    });

    afterEach(() => {
        // Restore the original Date.now after each test
        Date.now = originalDateNow;
    });

    it('should return 1 when no extensions are provided', () => {
        const result = getCurrentTokenScaledUiAmountMultiplier(undefined);
        expect(result).toBe('1');
    });

    it('should return 1 when extensions array is empty', () => {
        const result = getCurrentTokenScaledUiAmountMultiplier([]);
        expect(result).toBe('1');
    });

    it('should return 1 when extensions do not include scaledUiAmountConfig', () => {
        const extensions: TokenExtension[] = [
            {
                extension: 'transferFeeConfig',
                state: {},
            },
        ];
        const result = getCurrentTokenScaledUiAmountMultiplier(extensions);
        expect(result).toBe('1');
    });

    it('should return current multiplier when current time is before effective timestamp', () => {
        const now = 1711486400000; // March 27, 2024 00:00:00 UTC
        Date.now = vi.fn(() => now);

        const extensions: TokenExtension[] = [
            {
                extension: 'scaledUiAmountConfig',
                state: {
                    multiplier: '1',
                    newMultiplier: '2',
                    newMultiplierEffectiveTimestamp: Math.floor(now / 1000) + 3600, // 1 hour in the future
                },
            },
        ];

        const result = getCurrentTokenScaledUiAmountMultiplier(extensions);
        expect(result).toBe('1');
    });

    it('should return new multiplier when current time is after effective timestamp', () => {
        const now = 1711486400000; // March 27, 2024 00:00:00 UTC
        Date.now = vi.fn(() => now);

        const extensions: TokenExtension[] = [
            {
                extension: 'scaledUiAmountConfig',
                state: {
                    multiplier: '1',
                    newMultiplier: '2',
                    newMultiplierEffectiveTimestamp: Math.floor(now / 1000) - 3600, // 1 hour in the past
                },
            },
        ];

        const result = getCurrentTokenScaledUiAmountMultiplier(extensions);
        expect(result).toBe('2');
    });

    it('should return new multiplier when current time equals effective timestamp', () => {
        const now = 1711486400000; // March 27, 2024 00:00:00 UTC
        Date.now = vi.fn(() => now);

        const extensions: TokenExtension[] = [
            {
                extension: 'scaledUiAmountConfig',
                state: {
                    multiplier: '1',
                    newMultiplier: '2',
                    newMultiplierEffectiveTimestamp: Math.floor(now / 1000), // exactly now
                },
            },
        ];

        const result = getCurrentTokenScaledUiAmountMultiplier(extensions);
        expect(result).toBe('2');
    });
});
