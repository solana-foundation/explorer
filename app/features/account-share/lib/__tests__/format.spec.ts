import { describe, expect, it } from 'vitest';

import { formatBytes, formatDateShort } from '../format';

describe('formatBytes', () => {
    it('should keep sub-megabyte sizes in bytes with a thousands separator', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(82)).toBe('82 B');
        expect(formatBytes(165)).toBe('165 B');
        expect(formatBytes(8_320)).toBe('8,320 B');
    });

    it('should round a megabyte or more to MB', () => {
        expect(formatBytes(1_300_234)).toBe('1.24 MB');
        expect(formatBytes(2_892_224)).toBe('2.76 MB');
    });

    it('should round a gigabyte or more to GB', () => {
        expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.00 GB');
    });
});

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
