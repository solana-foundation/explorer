import { describe, expect, it } from 'vitest';

import { toScaledUiAmount } from '../to-scaled-ui-amount';

describe('toScaledUiAmount', () => {
    it('should truncate a scaled amount to the decimals of the mint', () => {
        const uiAmount = toScaledUiAmount({ decimals: 8, multiplier: '1.007474126658766', rawAmount: '23532095161' });

        expect(uiAmount.toFixed()).toBe('237.0797702');
    });

    it('should multiply as an f64, not as an exact decimal', () => {
        const uiAmount = toScaledUiAmount({ decimals: 8, multiplier: '1.007474126658766', rawAmount: '6047425270080' });

        expect(uiAmount.toFixed()).toBe('60926.24492507');
    });

    it('should keep every digit of an amount above 2^53 that has no multiplier', () => {
        const uiAmount = toScaledUiAmount({ decimals: 9, multiplier: '1', rawAmount: '18446744073709551615' });

        expect(uiAmount.toFixed()).toBe('18446744073.709551615');
    });
});
