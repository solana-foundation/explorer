import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenExtension } from '../../validators/accounts/token-extension';
import { getCurrentTokenScaledUiAmountMultiplier } from '../token-info';

const NOW_SECONDS = 1711486400; // March 27, 2024 00:00:00 UTC

describe('getCurrentTokenScaledUiAmountMultiplier', () => {
    beforeEach(() => {
        vi.setSystemTime(NOW_SECONDS * 1000);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.each<{ description: string; extensions: TokenExtension[] | undefined }>([
        { description: 'no extensions are provided', extensions: undefined },
        { description: 'extensions array is empty', extensions: [] },
        {
            description: 'extensions do not include scaledUiAmountConfig',
            extensions: [{ extension: 'transferFeeConfig', state: {} }],
        },
    ])('should return 1 when $description', ({ extensions }) => {
        expect(getCurrentTokenScaledUiAmountMultiplier(extensions)).toBe('1');
    });

    it.each([
        { expected: '1', moment: 'before', offsetSeconds: 3600 },
        { expected: '2', moment: 'after', offsetSeconds: -3600 },
        { expected: '2', moment: 'at', offsetSeconds: 0 },
    ])(
        'should return multiplier $expected when current time is $moment effective timestamp',
        ({ expected, offsetSeconds }) => {
            const extensions: TokenExtension[] = [
                {
                    extension: 'scaledUiAmountConfig',
                    state: {
                        multiplier: '1',
                        newMultiplier: '2',
                        newMultiplierEffectiveTimestamp: NOW_SECONDS + offsetSeconds,
                    },
                },
            ];

            expect(getCurrentTokenScaledUiAmountMultiplier(extensions)).toBe(expected);
        },
    );
});
