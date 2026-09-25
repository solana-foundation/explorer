import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { settleWithin } from '../settle-within';

/** A task that settles after `ms`, so a case can place it either side of the budget. */
function after<T>(ms: number, value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

describe('settleWithin', () => {
    beforeEach(() => vi.useFakeTimers());

    afterEach(() => vi.useRealTimers());

    it('should return every value when all tasks settle inside the budget', async () => {
        const promise = settleWithin(1_000, [after(100, 'a'), after(200, 'b')]);
        await vi.advanceTimersByTimeAsync(200);
        await expect(promise).resolves.toEqual(['a', 'b']);
    });

    it('should keep input order even when the tasks settle out of order', async () => {
        const promise = settleWithin(1_000, [after(200, 'slow'), after(50, 'fast')]);
        await vi.advanceTimersByTimeAsync(200);
        await expect(promise).resolves.toEqual(['slow', 'fast']);
    });

    it('should yield undefined for a task that outlives the budget and keep the rest', async () => {
        const promise = settleWithin(500, [after(100, 'in time'), after(5_000, 'too slow')]);
        await vi.advanceTimersByTimeAsync(500);
        await expect(promise).resolves.toEqual(['in time', undefined]);
    });

    it('should resolve as soon as the last task settles rather than waiting out the budget', async () => {
        const promise = settleWithin(10_000, [after(10, 'a')]);
        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual(['a']);
    });

    it('should clear the budget timer once every task settles', async () => {
        const promise = settleWithin(10_000, [after(10, 'a')]);

        await vi.advanceTimersByTimeAsync(10);
        await promise;

        // Without the clear, the 10s timer stays pending and holds the event loop open long after the
        // caller has its answer.
        expect(vi.getTimerCount()).toBe(0);
    });

    it('should resolve to an empty array, and start no timer, when there are no tasks', async () => {
        await expect(settleWithin(10_000, [])).resolves.toEqual([]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('should propagate a rejection, the same way Promise.all does', async () => {
        const promise = settleWithin(1_000, [after(10, 'a'), Promise.reject(new Error('boom'))]);
        await expect(promise).rejects.toThrow('boom');
    });

    it('should clear the budget timer when a task rejects', async () => {
        const promise = settleWithin(10_000, [Promise.reject(new Error('boom'))]);
        await expect(promise).rejects.toThrow('boom');
        expect(vi.getTimerCount()).toBe(0);
    });
});
