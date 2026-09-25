const SHORT_DATE = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
});

/** A unix-seconds timestamp as "Aug 26, 2026" in UTC, the form the activity line prints. */
export function formatDateShort(unixSeconds: number): string {
    return SHORT_DATE.format(new Date(unixSeconds * 1000));
}
