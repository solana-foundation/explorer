import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { withBackoff } from '../with-backoff';

describe('withBackoff', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Silence the retry log so test output stays clean and env-independent.
        vi.spyOn(Logger, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should resolve with the result on the first successful attempt, without retrying or logging', async () => {
        const fn = vi.fn().mockResolvedValue('ok');

        await expect(withBackoff(fn)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(Logger.debug).not.toHaveBeenCalled();
    });

    it('should retry and resolve once a later attempt succeeds', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('boom 1'))
            .mockRejectedValueOnce(new Error('boom 2'))
            .mockResolvedValue('ok');

        const promise = withBackoff(fn);
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should rethrow the last error after exhausting retries', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('first'))
            .mockRejectedValueOnce(new Error('second'))
            .mockRejectedValue(new Error('last'));

        const promise = withBackoff(fn, { maxRetries: 2 });
        const assertion = expect(promise).rejects.toThrow('last');
        await vi.runAllTimersAsync();
        await assertion;

        // 1 initial attempt + 2 retries.
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should make maxRetries + 1 attempts by default', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('nope'));

        const promise = withBackoff(fn);
        const assertion = expect(promise).rejects.toThrow('nope');
        await vi.runAllTimersAsync();
        await assertion;

        expect(fn).toHaveBeenCalledTimes(6);
    });

    it('should wait initialDelay and multiply it by factor between retries', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('x'));

        const promise = withBackoff(fn, { factor: 3, initialDelay: 100, maxRetries: 2 });
        const assertion = expect(promise).rejects.toThrow('x');

        // First attempt runs immediately; flush the scheduling of the first retry timer.
        await vi.advanceTimersByTimeAsync(0);
        expect(fn).toHaveBeenCalledTimes(1);

        // Nothing else fires until the initial 100ms delay elapses.
        await vi.advanceTimersByTimeAsync(99);
        expect(fn).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(fn).toHaveBeenCalledTimes(2);

        // The next delay grows by `factor`: 100 * 3 = 300ms.
        await vi.advanceTimersByTimeAsync(299);
        expect(fn).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(fn).toHaveBeenCalledTimes(3);

        await assertion;
    });

    it('should throw on the first failure without sleeping when shouldRetry returns false', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('fatal'));
        vi.mocked(Logger.debug).mockClear();

        // No timer flush here on purpose: a fatal failure must reject before a retry timer is ever scheduled.
        await expect(withBackoff(fn, { shouldRetry: () => false })).rejects.toThrow('fatal');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(Logger.debug).not.toHaveBeenCalled();
    });

    it('should consult shouldRetry with the error and retry the ones it accepts', async () => {
        const fn = vi.fn().mockRejectedValueOnce(new Error('retryable')).mockResolvedValue('ok');
        const shouldRetry = vi.fn((error: unknown) => (error as Error).message === 'retryable');

        const promise = withBackoff(fn, { shouldRetry });
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toBe('ok');
        expect(shouldRetry).toHaveBeenCalledWith(expect.objectContaining({ message: 'retryable' }));
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not attempt anything for a deadline that has already expired', async () => {
        const fn = vi.fn().mockResolvedValue('ok');
        const expired = AbortSignal.abort();

        await expect(withBackoff(fn, { abortSignal: expired })).rejects.toHaveProperty('name', 'AbortError');
        expect(fn).not.toHaveBeenCalled();
    });

    it('should stop retrying once the deadline expires, and report the abort over the failure', async () => {
        const deadline = new AbortController();
        // The caller moves on while this attempt is in flight, as a stage budget lapsing mid-request would.
        const fn = vi.fn().mockImplementation(() => {
            deadline.abort();
            return Promise.reject(new Error('rpc unreachable'));
        });

        // No timer flush on purpose: an expired deadline must reject before a retry timer is scheduled.
        await expect(withBackoff(fn, { abortSignal: deadline.signal, shouldRetry: () => true })).rejects.toHaveProperty(
            'name',
            'AbortError',
        );
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should stop waiting as soon as the controller aborts the signal', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('error'));
        const deadline = new AbortController();

        const promise = withBackoff(fn, { abortSignal: deadline.signal, initialDelay: 1000, maxRetries: 1 });

        // Let the first attempt fail, which schedules the 1000ms retry delay.
        await vi.advanceTimersByTimeAsync(100);
        expect(vi.getTimerCount()).toBe(1);

        deadline.abort();

        expect(vi.getTimerCount()).toBe(0);
        // The clock never reaches 1000ms: only a delay that the abort cut short settles here.
        await expect(promise).rejects.toHaveProperty('name', 'AbortError');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry as usual while the deadline holds', async () => {
        const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok');
        const deadline = new AbortController();

        const promise = withBackoff(fn, { abortSignal: deadline.signal });
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
