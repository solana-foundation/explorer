const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;
const BYTES_PER_GB = BYTES_PER_MB * 1024;

/**
 * A byte count as the design writes it: small accounts stay in bytes with a thousands separator
 * ("8,320 B"), larger ones round to MB/GB ("1.24 MB"). Matches the explorer's own size labels.
 */
export function formatBytes(bytes: number): string {
    if (bytes < BYTES_PER_MB) return `${Math.round(bytes).toLocaleString('en-US')} B`;
    if (bytes < BYTES_PER_GB) return `${(bytes / BYTES_PER_MB).toFixed(2)} MB`;
    return `${(bytes / BYTES_PER_GB).toFixed(2)} GB`;
}

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
