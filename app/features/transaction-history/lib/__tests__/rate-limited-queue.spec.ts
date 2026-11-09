import { SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, SolanaError } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRateLimitedQueue } from '../rate-limited-queue';

const WINDOW_MS = 1000;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createRateLimitedQueue', () => {
    it('should start at most the budget of tasks in one window', async () => {
        const queue = createRateLimitedQueue({ budget: 2, rateLimitRetries: 0, windowMs: WINDOW_MS });
        const starts = startTimes();

        const done = Promise.all([1, 2, 3].map(() => queue(starts.record)));
        await vi.runAllTimersAsync();
        await done;

        expect(starts.relative()).toEqual([0, 0, WINDOW_MS]);
    });

    it('should start a task only after the one before it settles', async () => {
        const queue = createRateLimitedQueue({ budget: 10, rateLimitRetries: 0, windowMs: WINDOW_MS });
        let releaseFirst!: () => void;
        const second = vi.fn(async () => {});

        void queue(() => new Promise<void>(resolve => (releaseFirst = resolve)));
        const secondDone = queue(second);
        await vi.advanceTimersByTimeAsync(0);
        expect(second).not.toHaveBeenCalled();

        releaseFirst();
        await secondDone;
        expect(second).toHaveBeenCalledOnce();
    });

    it('should pause every task for a window after a rate-limited call, then run that task again', async () => {
        const queue = createRateLimitedQueue({ budget: 10, rateLimitRetries: 1, windowMs: WINDOW_MS });
        const starts = startTimes();
        const limitedOnce = vi
            .fn<() => Promise<string>>()
            .mockImplementationOnce(() => starts.record().then(() => Promise.reject(rateLimited())))
            .mockImplementationOnce(() => starts.record().then(() => 'loaded'));

        const first = queue(limitedOnce);
        const second = queue(starts.record);
        await vi.runAllTimersAsync();

        await expect(first).resolves.toBe('loaded');
        await second;
        expect(starts.relative()).toEqual([0, WINDOW_MS, WINDOW_MS]);
    });

    it('should reject with the rate-limit error once its retries run out', async () => {
        const queue = createRateLimitedQueue({ budget: 10, rateLimitRetries: 1, windowMs: WINDOW_MS });
        const alwaysLimited = vi.fn(() => Promise.reject(rateLimited()));

        const result = queue(alwaysLimited);
        const assertion = expect(result).rejects.toThrow(SolanaError);
        await vi.runAllTimersAsync();

        await assertion;
        expect(alwaysLimited).toHaveBeenCalledTimes(2);
    });

    it('should pause the queue even when the rate-limited task has no retries left', async () => {
        const queue = createRateLimitedQueue({ budget: 10, rateLimitRetries: 0, windowMs: WINDOW_MS });
        const starts = startTimes();
        const limited = vi.fn(() => starts.record().then(() => Promise.reject(rateLimited())));

        const first = queue(limited);
        const assertion = expect(first).rejects.toThrow(SolanaError);
        const second = queue(starts.record);
        await vi.runAllTimersAsync();

        await assertion;
        await second;
        expect(starts.relative()).toEqual([0, WINDOW_MS]);
    });

    it.each([
        ['an HTTP 500', () => httpError(500, 'Internal Server Error')],
        ['a network failure', () => new TypeError('Failed to fetch')],
    ])('should reject %s at once and leave the queue unpaused', async (_label, makeError) => {
        const queue = createRateLimitedQueue({ budget: 10, rateLimitRetries: 1, windowMs: WINDOW_MS });
        const starts = startTimes();
        const error = makeError();
        const failing = vi.fn(() => starts.record().then(() => Promise.reject(error)));

        const first = queue(failing);
        const assertion = expect(first).rejects.toBe(error);
        const second = queue(starts.record);
        await vi.runAllTimersAsync();

        await assertion;
        await second;
        expect(failing).toHaveBeenCalledOnce();
        expect(starts.relative()).toEqual([0, 0]);
    });

    it.each([
        { budget: 0 },
        { budget: Number.NaN },
        { budget: 1.5 },
        { windowMs: 0 },
        { windowMs: Number.NaN },
        { windowMs: Number.POSITIVE_INFINITY },
        { rateLimitRetries: -1 },
        { rateLimitRetries: 0.5 },
        { rateLimitRetries: Number.NaN },
    ])('should reject the option %o', invalid => {
        const [name] = Object.keys(invalid);

        expect(() =>
            createRateLimitedQueue({ budget: 1, rateLimitRetries: 0, windowMs: WINDOW_MS, ...invalid }),
        ).toThrow(name);
    });
});

function rateLimited(): SolanaError {
    return httpError(429, 'Too Many Requests');
}

function httpError(statusCode: number, message: string): SolanaError {
    return new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, { headers: new Headers(), message, statusCode });
}

function startTimes(): { record: () => Promise<void>; relative: () => number[] } {
    const t0 = Date.now();
    const times: number[] = [];
    return {
        record: async () => {
            times.push(Date.now());
        },
        relative: () => times.map(t => t - t0),
    };
}
