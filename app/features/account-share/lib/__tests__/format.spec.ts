import { describe, expect, it } from 'vitest';

import { formatDateShort } from '../format';

describe('formatDateShort', () => {
    it('should print a unix-seconds timestamp as a short UTC date', () => {
        // 2026-08-26T11:32:13Z
        expect(formatDateShort(1_787_743_933)).toBe('Aug 26, 2026');
    });

    it('should read the day in UTC, not the local zone', () => {
        // 2026-01-01T00:30:00Z stays Jan 1 regardless of the runner's timezone.
        expect(formatDateShort(1_767_227_400)).toBe('Jan 1, 2026');
    });
});
