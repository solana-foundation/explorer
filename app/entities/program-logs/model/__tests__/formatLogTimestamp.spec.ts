import { describe, expect, it } from 'vitest';

import { formatLogTimestamp } from '../formatLogTimestamp';

describe('formatLogTimestamp', () => {
    it('should format a UTC date as HH:mm:ss UTC', () => {
        expect(formatLogTimestamp(new Date('2024-01-15T10:30:45Z'))).toBe('10:30:45 UTC');
    });

    it('should zero-pad single-digit hours, minutes, and seconds', () => {
        expect(formatLogTimestamp(new Date('2024-01-15T01:02:03Z'))).toBe('01:02:03 UTC');
    });

    it('should ignore local timezone offset and always render in UTC', () => {
        const date = new Date(Date.UTC(2024, 0, 15, 23, 59, 59));
        expect(formatLogTimestamp(date)).toBe('23:59:59 UTC');
    });
});
