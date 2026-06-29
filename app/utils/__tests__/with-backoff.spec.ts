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
});
