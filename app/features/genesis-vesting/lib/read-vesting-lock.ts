import { type Address, getAddressDecoder } from '@solana/kit';

import { CLAIM_SCHEDULE_BUCKET_V2_KEY, CLAIM_SCHEDULE_BUCKET_V2_SIZE } from './constants';

export type VestingLockStatus =
    'not-started' | 'vesting' | 'paused' | 'fully-vested' | 'cancelled' | 'ended' | 'failed';

/** Amounts are raw base units; times are unix seconds. `undefined` time = waiting for a trigger such as graduation. */
export type VestingLock = {
    genesis: Address;
    mint: Address;
    recipient: Address;
    allocation: bigint;
    /** Released by the schedule so far, claimed or not. */
    vested: bigint;
    claimed: bigint;
    /** Vested but not claimed, once the claim window is open; 0 before. */
    claimableNow: bigint;
    /** Not vested yet: the non-circulating amount. */
    locked: bigint;
    status: VestingLockStatus;
    schedule: {
        cliff: number | undefined;
        cliffBps: number;
        linearStart: number | undefined;
        linearEnd: number | undefined;
        period: number;
        /** `always` = an `Always` condition: claims are open from the start. */
        claimOpens: number | 'always' | undefined;
        secondsPaused: number;
    };
    nextUnlock: { time: number; amount: bigint } | undefined;
    policy: {
        pausable: boolean;
        cancelable: boolean;
        cancelableByRecipient: boolean;
        transferable: boolean;
        transferableByRecipient: boolean;
    };
};

export function isVestingLockData(data: Uint8Array): boolean {
    return data.length >= CLAIM_SCHEDULE_BUCKET_V2_SIZE && data[0] === CLAIM_SCHEDULE_BUCKET_V2_KEY;
}

/**
 * Decodes a `ClaimScheduleBucketV2` and evaluates its vesting state at unix time `now`, the same way the
 * Genesis program does (`ClaimSchedule::mutate_claim_amount_at` and `ClaimScheduleBucketV2::effective_now`).
 * Ported from `readLock` in genesis-vesting-kit `examples/read_vesting_locks/kit.ts`; byte offsets are in the
 * kit's `docs/integration-guide.md` §2.
 */
export function readVestingLock(data: Uint8Array, now: number): VestingLock | undefined {
    if (!isVestingLockData(data)) return undefined;

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const allocation = view.getBigUint64(48, true);
    const failed = view.getUint8(144) === 1;
    const claimed = view.getBigUint64(240, true);
    const start = conditionTime(view, 248);
    const duration = view.getBigUint64(312, true);
    // The program rejects a zero period; the floor keeps a malformed account from throwing on division.
    const period = maxBigint(view.getBigUint64(320, true), 1n);
    const cliffTime = conditionTime(view, 328);
    const cliffBps = view.getUint16(392, true);
    // The claim-start slot also accepts `Always`, which the program treats as met without stamping a time.
    const claimStart = data[520] === ALWAYS ? 'always' : conditionTime(view, 520);
    const endedAt = conditionTime(view, 584);
    const paused = view.getUint8(648) === 1;
    const pausedAt = Number(view.getBigInt64(656, true));
    const totalPaused = Number(view.getBigInt64(664, true));

    // Pause-adjusted clock, frozen at the end condition once cancelled or completed.
    const raw = endedAt ?? now;
    const t = raw - totalPaused - (paused ? Math.max(0, raw - pausedAt) : 0);

    const cliff = (allocation * BigInt(cliffBps)) / 10_000n;
    const vestedAt = (at: number) => {
        let vested = cliffTime !== undefined && at >= cliffTime ? cliff : 0n;
        if (start !== undefined) {
            if (at >= start + Number(duration)) {
                vested += allocation - cliff;
            } else if (at >= start) {
                const elapsed = (BigInt(at - start) / period) * period;
                // Round up (div_ceil), as the program does, so claims match to the base unit.
                vested += ((allocation - cliff) * elapsed + duration - 1n) / duration;
            }
        }
        return vested;
    };

    const vested = failed ? claimed : vestedAt(t);
    const endedShort = endedAt !== undefined && vested < allocation;
    // The program also ends a schedule itself when a claim lands after the linear end; a cliff still ahead
    // at that point never vests. Only an end before the linear end is certainly a cancel.
    const linearEnd = start === undefined ? undefined : start + Number(duration);
    const cancelled = endedShort && (linearEnd === undefined || t < linearEnd);
    const ended = failed || endedShort;
    const locked = ended ? 0n : allocation - vested;

    return {
        allocation,
        claimableNow:
            claimStart === 'always' || (claimStart !== undefined && now >= claimStart) ? vested - claimed : 0n,
        claimed,
        genesis: decodeAddress(data, 16),
        locked,
        mint: decodeAddress(data, 80),
        nextUnlock:
            ended || paused || locked === 0n
                ? undefined
                : nextUnlock({ cliffTime, duration, period, start, t, totalPaused, vested, vestedAt }),
        policy: {
            cancelable: data[769] === 1,
            cancelableByRecipient: data[770] === 1,
            pausable: data[768] === 1,
            transferable: data[771] === 1,
            transferableByRecipient: data[772] === 1,
        },
        recipient: decodeAddress(data, 208),
        schedule: {
            claimOpens: claimStart,
            cliff: cliffTime,
            cliffBps,
            linearEnd,
            linearStart: start,
            period: Number(period),
            secondsPaused: totalPaused,
        },
        status: failed
            ? 'failed'
            : cancelled
              ? 'cancelled'
              : endedShort
                ? 'ended'
                : paused
                  ? 'paused'
                  : locked === 0n
                    ? 'fully-vested'
                    : vested === 0n
                      ? 'not-started'
                      : 'vesting',
        vested,
    };
}

const NOT_TRIGGERED = 0x7fff_ffff_ffff_ffffn; // i64::MAX
const TIME_ABSOLUTE = 1;
const ALWAYS = 5;

// A Condition is 64 bytes: type at +0, TimeAbsolute time at +48, triggered_timestamp at +56.
function conditionTime(view: DataView, offset: number): number | undefined {
    const triggered = view.getBigInt64(offset + 56, true);
    if (triggered !== NOT_TRIGGERED) return Number(triggered);
    // The program stamps triggered_timestamp only when a transaction touches the lock, so a TimeAbsolute
    // condition in the past can still read "not triggered"; its configured time is authoritative.
    return view.getUint8(offset) === TIME_ABSOLUTE ? Number(view.getBigInt64(offset + 48, true)) : undefined;
}

function nextUnlock({
    cliffTime,
    duration,
    period,
    start,
    t,
    totalPaused,
    vested,
    vestedAt,
}: {
    cliffTime: number | undefined;
    duration: bigint;
    period: bigint;
    start: number | undefined;
    t: number;
    totalPaused: number;
    vested: bigint;
    vestedAt: (at: number) => bigint;
}): VestingLock['nextUnlock'] {
    const candidates = [cliffTime ?? Infinity];
    if (start !== undefined) {
        const step = Number(period);
        const end = start + Number(duration);
        const stepsTaken = t < start ? 0 : Math.floor((t - start) / step);
        candidates.push(Math.min(start + (stepsTaken + 1) * step, end));
    }
    const next = Math.min(...candidates.filter(candidate => candidate > t));
    if (!Number.isFinite(next)) return undefined;
    // `next` is on the pause-adjusted clock; adding the paused time moves it back to wall-clock time.
    return { amount: vestedAt(next) - vested, time: next + totalPaused };
}

function decodeAddress(data: Uint8Array, offset: number): Address {
    return getAddressDecoder().decode(data.subarray(offset, offset + 32));
}

function maxBigint(a: bigint, b: bigint): bigint {
    return a > b ? a : b;
}
