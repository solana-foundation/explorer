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

// Mirrors moment.js `fromNow()` English thresholds & textual quantifiers so the migration
// off react-moment is visually faithful. See https://momentjs.com/docs/#/displaying/fromnow/
function relativePhrase(absSeconds: number): string {
    if (absSeconds < 45) return 'a few seconds';
    if (absSeconds < 90) return 'a minute';
    const absMinutes = Math.round(absSeconds / 60);
    if (absMinutes < 45) return `${absMinutes} minutes`;
    if (absMinutes < 90) return 'an hour';
    const absHours = Math.round(absMinutes / 60);
    if (absHours < 22) return `${absHours} hours`;
    if (absHours < 36) return 'a day';
    const absDays = Math.round(absHours / 24);
    if (absDays < 26) return `${absDays} days`;
    if (absDays < 46) return 'a month';
    const absMonths = Math.round(absDays / 30);
    if (absMonths < 11) return `${absMonths} months`;
    if (absMonths < 18) return 'a year';
    return `${Math.round(absMonths / 12)} years`;
}

export function formatRelativeTime(unixTimestamp: number, now: number = Date.now()): string {
    const diffMs = unixTimestamp - now;
    const phrase = relativePhrase(Math.abs(diffMs) / 1000);
    return diffMs <= 0 ? `${phrase} ago` : `in ${phrase}`;
}
