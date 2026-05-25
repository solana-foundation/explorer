import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from '../date';

const NOW = new Date('2026-05-25T12:00:00Z').getTime();
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Cases mirror moment.js `fromNow()` English thresholds:
// 0–44s → "a few seconds"; 45–89s → "a minute"; 90s–44m → "X minutes";
// 45–89m → "an hour"; 90m–21h → "X hours"; 22–35h → "a day"; 36h–25d → "X days";
// 26–45d → "a month"; 46d–10mo → "X months"; 11–17mo → "a year"; ≥18mo → "X years".
const PAST_CASES: Array<[label: string, offsetMs: number, expected: string]> = [
    ['1s', 1 * SECOND, 'a few seconds ago'],
    ['44s (upper "a few seconds")', 44 * SECOND, 'a few seconds ago'],
    ['45s (lower "a minute")', 45 * SECOND, 'a minute ago'],
    ['60s', 60 * SECOND, 'a minute ago'],
    ['89s (upper "a minute")', 89 * SECOND, 'a minute ago'],
    ['90s (lower "X minutes")', 90 * SECOND, '2 minutes ago'],
    ['5min', 5 * MINUTE, '5 minutes ago'],
    ['44min (upper "X minutes")', 44 * MINUTE, '44 minutes ago'],
    ['45min (lower "an hour")', 45 * MINUTE, 'an hour ago'],
    ['89min (upper "an hour")', 89 * MINUTE, 'an hour ago'],
    ['90min (lower "X hours")', 90 * MINUTE, '2 hours ago'],
    ['21h (upper "X hours")', 21 * HOUR, '21 hours ago'],
    ['22h (lower "a day")', 22 * HOUR, 'a day ago'],
    ['35h (upper "a day")', 35 * HOUR, 'a day ago'],
    ['36h (lower "X days")', 36 * HOUR, '2 days ago'],
    ['25d (upper "X days")', 25 * DAY, '25 days ago'],
    ['26d (lower "a month")', 26 * DAY, 'a month ago'],
    ['45d (upper "a month")', 45 * DAY, 'a month ago'],
    ['46d (lower "X months")', 46 * DAY, '2 months ago'],
    ['10mo (upper "X months")', 10 * 30 * DAY, '10 months ago'],
    ['11mo (lower "a year")', 11 * 30 * DAY, 'a year ago'],
    ['17mo (upper "a year")', 17 * 30 * DAY, 'a year ago'],
    ['18mo (lower "X years")', 18 * 30 * DAY, '2 years ago'],
    ['3y', 3 * 12 * 30 * DAY, '3 years ago'],
];

describe('formatRelativeTime', () => {
    it.each(PAST_CASES)('should render past %s as %s', (_label, offset, expected) => {
        expect(formatRelativeTime(NOW - offset, NOW)).toBe(expected);
    });

    it.each(PAST_CASES)('should render future %s with `in` prefix', (_label, offset, expectedPast) => {
        const expectedFuture = `in ${expectedPast.replace(/ ago$/, '')}`;
        expect(formatRelativeTime(NOW + offset, NOW)).toBe(expectedFuture);
    });

    it('should treat current time as "a few seconds ago"', () => {
        expect(formatRelativeTime(NOW, NOW)).toBe('a few seconds ago');
    });
});
