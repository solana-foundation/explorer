import { formatTokenAmount } from '@entities/token-amount';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { numberWithSeparator } from '@utils/index';

import type { VestingLockStatus } from './read-vesting-lock';

export const STATUS_LABELS: Record<VestingLockStatus, string> = {
    cancelled: 'Cancelled',
    ended: 'Ended before cliff',
    failed: 'Failed',
    'fully-vested': 'Fully vested',
    'not-started': 'Not started',
    paused: 'Paused',
    vesting: 'Vesting',
};

/** Exact to the base unit: the Intl path of `formatTokenAmount` goes through `number` and rounds large supplies. */
export function formatAmount(amount: bigint, decimals: number): string {
    const [whole, fraction] = formatTokenAmount({ amount, decimals }).split('.');
    return fraction ? `${numberWithSeparator(whole)}.${fraction}` : numberWithSeparator(whole);
}

/** Share of `whole`, to two decimals. */
export function formatPercent(part: bigint, whole: bigint): string {
    if (whole === 0n) return '0%';
    return `${(Number((part * 10_000n) / whole) / 100).toFixed(2)}%`;
}

export function formatBps(bps: number): string {
    return `${bps / 100}%`;
}

/** A schedule time; `undefined` means the condition waits for a launch event such as graduation. */
export function formatTime(unix: number | undefined): string {
    return unix === undefined ? 'Waiting for trigger' : displayTimestampUtc(unixTimestampToMs(unix), true);
}

export function formatDuration(seconds: number): string {
    if (seconds >= DAY) return plural(+(seconds / DAY).toFixed(2), 'day');
    if (seconds >= HOUR) return plural(+(seconds / HOUR).toFixed(2), 'hour');
    return plural(seconds, 'second');
}

const HOUR = 3_600;
const DAY = 86_400;

function plural(n: number, unit: string): string {
    return `${n} ${n === 1 ? unit : `${unit}s`}`;
}
