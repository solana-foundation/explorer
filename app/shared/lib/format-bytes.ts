const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;
const BYTES_PER_GB = BYTES_PER_MB * 1024;

/**
 * A byte count for display: sub-megabyte sizes stay in bytes with a thousands separator ("8,320 B"),
 * larger ones round to MB/GB ("1.24 MB"). Shared by the account share-image cards and file-size messages.
 */
export function formatBytes(bytes: number): string {
    if (bytes < BYTES_PER_MB) return `${Math.round(bytes).toLocaleString('en-US')} B`;
    if (bytes < BYTES_PER_GB) return `${(bytes / BYTES_PER_MB).toFixed(2)} MB`;
    return `${(bytes / BYTES_PER_GB).toFixed(2)} GB`;
}
