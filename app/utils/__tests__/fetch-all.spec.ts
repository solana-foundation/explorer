import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAll } from '../fetch-all';

describe('fetchAll', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return results in the same order as input', async () => {
        const items = [1, 2, 3, 4, 5];
        const fn = async (n: number) => n * 2;

        const results = await fetchAll(items, fn);

        expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should respect the concurrency limit', async () => {
        let running = 0;
        let maxRunning = 0;

        const items = Array.from({ length: 20 }, (_, i) => i);
        const fn = async (n: number) => {
            running++;
            maxRunning = Math.max(maxRunning, running);
            await new Promise(resolve => setTimeout(resolve, 10));
            running--;
            return n;
        };

        const promise = fetchAll(items, fn, 3);
        await vi.advanceTimersByTimeAsync(10 * 20);

        await promise;
        expect(maxRunning).toBe(3);
    });

    it('should propagate errors from the callback', async () => {
        const items = [1, 2, 3];
        const fn = async (n: number) => {
            if (n === 2) throw new Error('fail');
            return n;
        };

        await expect(fetchAll(items, fn)).rejects.toThrow('fail');
    });
});
