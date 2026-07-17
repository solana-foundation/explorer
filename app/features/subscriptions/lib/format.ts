import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';

export function displayExpiry(ts: bigint): string {
    if (ts === 0n) return 'Never';
    return displayTimestampUtc(unixTimestampToMs(Number(ts)), true);
}
