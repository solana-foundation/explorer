import { displayTimestampUtc } from '@utils/date';

export function tsToMs(ts: bigint): number {
    return Number(ts * 1000n);
}

export function formatExpiry(ts: bigint): string {
    if (ts === 0n) return 'Never';
    return displayTimestampUtc(tsToMs(ts), true);
}
