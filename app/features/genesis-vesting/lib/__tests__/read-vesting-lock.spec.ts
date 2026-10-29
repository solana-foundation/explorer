import { describe, expect, it } from 'vitest';

import {
    ADVISORS_LOCK,
    ALWAYS_CLAIM_START_LOCK,
    CANCELLED_LOCK,
    LATE_CLIFF_LOCK,
    MAINNET_LOCK,
    PAUSED_LOCK,
    PAUSED_NOW_LOCK,
    TEAM_LOCK,
} from '../../__tests__/__fixtures__/lock-accounts';
import { isVestingLockData, readVestingLock } from '../read-vesting-lock';

// Checkpoints from genesis-vesting-kit docs/test-token.md, "Expected values". The token has 6 decimals.
const CREATED = 1_791_401_512;
const CLIFF = CREATED + 3_600;
const TOKEN = 1_000_000n;
// Creation time of the devnet token GVEXP, whose locks are ALWAYS_CLAIM_START_LOCK, PAUSED_NOW_LOCK and LATE_CLIFF_LOCK.
const GVEXP_CREATED = 1_793_216_025;

describe('readVestingLock', () => {
    it.each([
        [CREATED, 0n, 0n],
        [CLIFF, 100_000_000n * TOKEN, 0n],
        [CLIFF + 12 * 3_600, 150_000_000n * TOKEN, 0n],
        // Rounded up to the base unit (div_ceil), as the program does.
        [CLIFF + 86_400, 200_000_000n * TOKEN, 28_571_428_571_429n],
        [CLIFF + 3 * 86_400, 400_000_000n * TOKEN, 85_714_285_714_286n],
        [CREATED + 7 * 86_400 + 3_600, 400_000_000n * TOKEN, 200_000_000n * TOKEN],
    ])('should match the test token vested amounts at %i', (now, teamVested, advisorsVested) => {
        expect(read(TEAM_LOCK, now).vested).toBe(teamVested);
        expect(read(ADVISORS_LOCK, now).vested).toBe(advisorsVested);
    });

    it('should decode the schedule of a cliff-plus-linear lock', () => {
        const lock = read(TEAM_LOCK, CREATED);

        expect(lock).toMatchObject({
            allocation: 400_000_000n * TOKEN,
            locked: 400_000_000n * TOKEN,
            mint: '6LNGVeWcQVKDPNktwSJNFXe3Y5HYWVPWJFnggjSbTFYu',
            recipient: 'Tes1zkZkXhgTaMFqVgbgvMsVkRJpq4Y6g54SbDBeKVV',
            schedule: {
                cliff: CLIFF,
                cliffBps: 2_500,
                linearEnd: CLIFF + 3 * 86_400,
                linearStart: CLIFF,
                period: 3_600,
            },
            status: 'not-started',
        });
        expect(lock.genesis).toBe('9BMM3hSm7s2v79qsPYAi7z8rVdDkddSRqC8tBY6TF59d');
        expect(lock.nextUnlock).toEqual({ amount: 100_000_000n * TOKEN, time: CLIFF });
    });

    it('should report the next linear step while vesting', () => {
        const lock = read(ADVISORS_LOCK, CREATED + 86_400 + 60);

        expect(lock.status).toBe('vesting');
        expect(lock.nextUnlock?.time).toBe(CREATED + 2 * 86_400);
    });

    it('should read the policy flags', () => {
        expect(read(ADVISORS_LOCK, CREATED).policy).toMatchObject({ cancelable: true, pausable: true });
        expect(read(TEAM_LOCK, CREATED).policy).toMatchObject({ cancelable: false, pausable: false });
    });

    it('should shift the schedule by the paused time', () => {
        // Lock A was paused for 124 s; at its claim it had vested 3 steps of 60 tokens, not 5.
        const lock = read(PAUSED_LOCK, 1_791_402_130);

        expect(lock.schedule.secondsPaused).toBe(124);
        expect(lock.vested).toBe(180n * TOKEN);
    });

    it('should freeze a cancelled lock and count nothing as locked', () => {
        const lock = read(CANCELLED_LOCK, CREATED + 30 * 86_400);

        expect(lock).toMatchObject({ locked: 0n, nextUnlock: undefined, status: 'cancelled', vested: 240n * TOKEN });
    });

    it('should keep the claim window closed until its trigger fires', () => {
        const lock = read(MAINNET_LOCK, 1_793_145_600);

        expect(lock).toMatchObject({
            claimableNow: 0n,
            locked: 800_000_000n * TOKEN,
            schedule: { claimOpens: undefined, cliffBps: 1_250 },
            status: 'not-started',
        });
        expect(lock.nextUnlock?.amount).toBe(100_000_000n * TOKEN);
        expect(new Date((lock.nextUnlock?.time ?? 0) * 1000).toISOString()).toBe('2027-01-16T00:30:00.000Z');
    });

    it('should open claims at once for an Always claim-start condition', () => {
        // GVEXP lock 0: Always claim start, 10% cliff claimed at creation, 10 days linear in daily steps.
        // After the first step the program lets the recipient claim it; the kit's reader reports 0 here.
        const lock = read(ALWAYS_CLAIM_START_LOCK, GVEXP_CREATED + 86_400);

        expect(lock.schedule.claimOpens).toBe('always');
        expect(lock.vested).toBe(190n * TOKEN);
        expect(lock.claimableNow).toBe(90n * TOKEN);
    });

    it('should freeze a lock that is paused now and report no next unlock', () => {
        // GVEXP lock 1: 20% cliff vested, paused right after creation and never resumed.
        const later = read(PAUSED_NOW_LOCK, GVEXP_CREATED + 5 * 86_400);

        expect(later).toMatchObject({
            claimableNow: 200n * TOKEN,
            locked: 800n * TOKEN,
            nextUnlock: undefined,
            status: 'paused',
            vested: 200n * TOKEN,
        });
    });

    it('should label a schedule the program ended at the linear end, before its cliff', () => {
        // GVEXP lock 2: a claim after the linear end ended the schedule; the 50% cliff after it never vests,
        // and a claim after the cliff time failed with NothingToClaim.
        const lock = read(LATE_CLIFF_LOCK, GVEXP_CREATED + 30 * 86_400);

        expect(lock).toMatchObject({ claimableNow: 0n, locked: 0n, status: 'ended', vested: 500n * TOKEN });
        expect(lock.schedule.cliff).toBeGreaterThan(lock.schedule.linearEnd ?? Infinity);
    });

    it('should count nothing as vested or locked once the sale it depends on failed', () => {
        // No lock on chain has failed; the program sets bucket.failed (byte 144) via the TransmitFailure behavior.
        const data = bytes(ADVISORS_LOCK);
        data[144] = 1;
        const lock = readVestingLock(data, CREATED + 30 * 86_400);

        expect(lock).toMatchObject({ locked: 0n, nextUnlock: undefined, status: 'failed' });
        expect(lock?.vested).toBe(lock?.claimed);
        expect(lock?.claimableNow).toBe(0n);
    });

    it('should reject data that is not a ClaimScheduleBucketV2', () => {
        const data = bytes(TEAM_LOCK);
        data[0] = 18;

        expect(isVestingLockData(data)).toBe(false);
        expect(readVestingLock(data, CREATED)).toBeUndefined();
        expect(readVestingLock(bytes(TEAM_LOCK).subarray(0, 900), CREATED)).toBeUndefined();
    });
});

function read(fixture: { base64: string }, now: number) {
    const lock = readVestingLock(bytes(fixture), now);
    if (!lock) throw new Error('fixture did not decode');
    return lock;
}

function bytes({ base64 }: { base64: string }): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
}
