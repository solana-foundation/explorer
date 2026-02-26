import { describe, expect, it, vi } from 'vitest';

import { fetchOnce } from '../fetch-once';

describe('fetchOnce', () => {
    it('should execute the callback', async () => {
        const inFlight = new Set<string>();
        const fn = vi.fn().mockResolvedValue(undefined);

        await fetchOnce('key', inFlight, fn);

        expect(fn).toHaveBeenCalledOnce();
    });

    it('should skip duplicate calls for the same key', async () => {
        const inFlight = new Set<string>();
        const fn = vi.fn().mockReturnValue(new Promise<void>(() => {}));

        fetchOnce('key', inFlight, fn);
        await fetchOnce('key', inFlight, fn);

        expect(fn).toHaveBeenCalledOnce();
    });

    it('should allow a new call after the previous one completes', async () => {
        const inFlight = new Set<string>();
        const fn = vi.fn().mockResolvedValue(undefined);

        await fetchOnce('key', inFlight, fn);
        await fetchOnce('key', inFlight, fn);

        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should track different keys independently', async () => {
        const inFlight = new Set<string>();
        const fnA = vi.fn().mockReturnValue(new Promise<void>(() => {}));
        const fnB = vi.fn().mockReturnValue(new Promise<void>(() => {}));

        fetchOnce('a', inFlight, fnA);
        fetchOnce('b', inFlight, fnB);

        expect(fnA).toHaveBeenCalledOnce();
        expect(fnB).toHaveBeenCalledOnce();
    });

    it('should remove key from inFlight when callback throws', async () => {
        const inFlight = new Set<string>();
        const fn = vi.fn().mockRejectedValue(new Error('fail'));

        await expect(fetchOnce('key', inFlight, fn)).rejects.toThrow('fail');
        expect(inFlight.has('key')).toBe(false);
    });
});
