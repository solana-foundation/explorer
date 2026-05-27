import { describe, expect, it } from 'vitest';

import { formatDuration, formatRelativeTime } from '../date';

const NOW = new Date('2026-05-25T12:00:00Z').getTime();
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const PAST_CASES: Array<[label: string, offsetMs: number, expected: string]> = [
    ['1s', 1 * SECOND, '1 second ago'],
    ['3s', 3 * SECOND, '5 seconds ago'],
    ['5s', 5 * SECOND, '10 seconds ago'],
    ['10s', 10 * SECOND, '20 seconds ago'],
    ['20s', 20 * SECOND, 'half a minute ago'],
    ['30s', 30 * SECOND, 'half a minute ago'],
    ['40s', 40 * SECOND, '1 minute ago'],
    ['60s', 60 * SECOND, '1 minute ago'],
    ['89s', 89 * SECOND, '1 minute ago'],
    ['90s', 90 * SECOND, '2 minutes ago'],
    ['5min', 5 * MINUTE, '5 minutes ago'],
    ['44min', 44 * MINUTE, '44 minutes ago'],
    ['45min', 45 * MINUTE, 'about 1 hour ago'],
    ['90min', 90 * MINUTE, 'about 2 hours ago'],
    ['22h', 22 * HOUR, 'about 22 hours ago'],
    ['36h', 36 * HOUR, '1 day ago'],
    ['25d', 25 * DAY, '25 days ago'],
    ['45d', 45 * DAY, 'about 2 months ago'],
    ['11mo', 11 * 30 * DAY, '11 months ago'],
    ['13mo', 13 * 30 * DAY, 'about 1 year ago'],
    ['18mo', 18 * 30 * DAY, 'over 1 year ago'],
    ['3y', 3 * 12 * 30 * DAY, 'almost 3 years ago'],
];

const FUTURE_CASES: Array<[label: string, offsetMs: number, expected: string]> = [
    ['1s', 1 * SECOND, 'in 1 second'],
    ['3s', 3 * SECOND, 'in 5 seconds'],
    ['30s', 30 * SECOND, 'in half a minute'],
    ['60s', 60 * SECOND, 'in 1 minute'],
    ['90s', 90 * SECOND, 'in 2 minutes'],
    ['5min', 5 * MINUTE, 'in 5 minutes'],
    ['45min', 45 * MINUTE, 'in about 1 hour'],
    ['22h', 22 * HOUR, 'in about 22 hours'],
    ['36h', 36 * HOUR, 'in 1 day'],
    ['25d', 25 * DAY, 'in 25 days'],
    ['45d', 45 * DAY, 'in about 2 months'],
    ['18mo', 18 * 30 * DAY, 'in over 1 year'],
];

describe('formatRelativeTime', () => {
    it.each(PAST_CASES)('should render past %s as %s', (_label, offset, expected) => {
        expect(formatRelativeTime(NOW - offset, NOW)).toBe(expected);
    });

    it.each(FUTURE_CASES)('should render future %s as %s', (_label, offset, expected) => {
        expect(formatRelativeTime(NOW + offset, NOW)).toBe(expected);
    });
});

const DURATION_CASES: Array<[seconds: number, expected: string]> = [
    [0, '1 second'],
    [1, '1 second'],
    [3, '5 seconds'],
    [30, 'half a minute'],
    [60, '1 minute'],
    [90, '2 minutes'],
    [5 * 60, '5 minutes'],
    [60 * 60, 'about 1 hour'],
    [5 * 60 * 60, 'about 5 hours'],
    [24 * 60 * 60, '1 day'],
    [5 * 24 * 60 * 60, '5 days'],
    [30 * 24 * 60 * 60, 'about 1 month'],
    [365 * 24 * 60 * 60, 'about 1 year'],
    [-1, '1 second'],
    [-60, '1 minute'],
    [-86400, '1 day'],
];

describe('formatDuration', () => {
    it.each(DURATION_CASES)('should render %i seconds as %s', (seconds, expected) => {
        expect(formatDuration(seconds, 'seconds')).toBe(expected);
    });
});
