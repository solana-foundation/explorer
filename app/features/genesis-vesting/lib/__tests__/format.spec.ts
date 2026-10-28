import { describe, expect, it } from 'vitest';

import { formatAmount, formatDuration, formatTime } from '../format';

describe('formatAmount', () => {
    it('should group the whole part and stay exact past Number.MAX_SAFE_INTEGER', () => {
        expect(formatAmount(1_000_000_000_000_000_001n, 9)).toBe('1,000,000,000.000000001');
    });
});

describe('formatDuration', () => {
    it('should pick the largest whole unit', () => {
        expect(formatDuration(86_400)).toBe('1 day');
        expect(formatDuration(2_629_800)).toBe('30.44 days');
        expect(formatDuration(3_600)).toBe('1 hour');
        expect(formatDuration(60)).toBe('60 seconds');
    });
});

describe('formatTime', () => {
    it('should name an untriggered condition', () => {
        expect(formatTime(undefined)).toBe('Waiting for trigger');
    });
});
