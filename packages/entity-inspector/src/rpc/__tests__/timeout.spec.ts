import { describe, expect, it, vi } from 'vitest';

import { raceWithTimeout } from '../timeout.js';

describe('raceWithTimeout', () => {
    it('should resolve when promise settles before timeout', async () => {
        const result = await raceWithTimeout(Promise.resolve('ok'), 1000);
        expect(result).toBe('ok');
    });

    it('should reject when promise exceeds timeout', async () => {
        await expect(raceWithTimeout(new Promise(() => {}), 10, 'test-op')).rejects.toThrow(
            'test-op timed out after 10ms',
        );
    });

    it('should propagate promise rejection instead of timeout', async () => {
        await expect(raceWithTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
    });

    it('should use default label when none provided', async () => {
        await expect(raceWithTimeout(new Promise(() => {}), 10)).rejects.toThrow('Operation timed out after 10ms');
    });

    it('should clear timeout after promise resolves', async () => {
        const spy = vi.spyOn(globalThis, 'clearTimeout');
        await raceWithTimeout(Promise.resolve('ok'), 1000);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
