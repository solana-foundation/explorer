import { formatDistance, type Locale } from 'date-fns';
import { enUS } from 'date-fns/locale';

export function unixTimestampToMs(seconds: number): number {
    return seconds * 1000;
}

export function displayTimestamp(unixTimestamp: number, shortTimeZoneName = false): string {
    const expireDate = new Date(unixTimestamp);
    const dateString = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(expireDate);
    const timeString = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hourCycle: 'h23',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: shortTimeZoneName ? 'short' : 'long',
    }).format(expireDate);
    return `${dateString} at ${timeString}`;
}

export function displayTimestampUtc(unixTimestamp: number, shortTimeZoneName = false): string {
    const expireDate = new Date(unixTimestamp);
    const dateString = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
        year: 'numeric',
    }).format(expireDate);
    const timeString = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hourCycle: 'h23',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'UTC',
        timeZoneName: shortTimeZoneName ? 'short' : 'long',
    }).format(expireDate);
    return `${dateString} at ${timeString}`;
}

export function displayTimestampWithoutDate(unixTimestamp: number, shortTimeZoneName = true) {
    const expireDate = new Date(unixTimestamp);
    const timeString = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hourCycle: 'h23',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: shortTimeZoneName ? 'short' : 'long',
    }).format(expireDate);
    return timeString;
}

// Drops date-fns' "less than" prefixes on sub-minute buckets; everything else
// inherits stock en-US phrasing (about/almost/over/half a).
const relativeLocale: Locale = {
    ...enUS,
    formatDistance: (token, count, options) => {
        const noLessThan: Record<string, { one: string; other: string }> = {
            lessThanXMinutes: { one: '1 minute', other: '{{count}} minutes' },
            lessThanXSeconds: { one: '1 second', other: '{{count}} seconds' },
        };
        const override = noLessThan[token];
        if (!override) return enUS.formatDistance(token, count, options);
        const tpl = count === 1 ? override.one : override.other.replace('{{count}}', String(count));
        if (!options?.addSuffix) return tpl;
        return options.comparison && options.comparison > 0 ? `in ${tpl}` : `${tpl} ago`;
    },
};

export function formatDuration(value: number, _unit: 'seconds'): string {
    const abs = Math.abs(value);
    if (abs < 2) return '1 second';
    return formatDistance(0, abs * 1000, { includeSeconds: true, locale: relativeLocale });
}

export function formatRelativeTime(unixTimestamp: number, now: number = Date.now()): string {
    const diffMs = unixTimestamp - now;
    if (Math.abs(diffMs) < 2000) return diffMs > 0 ? 'in 1 second' : '1 second ago';
    return formatDistance(unixTimestamp, now, {
        addSuffix: true,
        includeSeconds: true,
        locale: relativeLocale,
    });
}
