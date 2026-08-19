import { describe, expect, it, vi } from 'vitest';

// The client cache is module state, so each test loads a fresh copy of the module.
async function loadModule() {
    vi.resetModules();
    return import('../get-rpc');
}

describe('getRpc', () => {
    it('should return the same client for repeated calls with the same URL', async () => {
        const { getRpc } = await loadModule();
        expect(getRpc('http://localhost:8899')).toBe(getRpc('http://localhost:8899'));
    });

    it('should return distinct clients for distinct URLs', async () => {
        const { getRpc } = await loadModule();
        expect(getRpc('http://localhost:8899')).not.toBe(getRpc('http://localhost:8900'));
    });

    it('should evict the oldest client once the cache is full', async () => {
        const { getRpc, MAX_CACHED_RPCS } = await loadModule();
        const first = getRpc('http://first.example');
        for (let i = 0; i < MAX_CACHED_RPCS; i++) {
            getRpc(`http://filler-${i}.example`);
        }
        expect(getRpc('http://first.example')).not.toBe(first);
    });

    it('should keep a client cached while newer entries fit within the bound', async () => {
        const { getRpc, MAX_CACHED_RPCS } = await loadModule();
        const kept = getRpc('http://kept.example');
        for (let i = 0; i < MAX_CACHED_RPCS - 1; i++) {
            getRpc(`http://churn-${i}.example`);
        }
        expect(getRpc('http://kept.example')).toBe(kept);
    });
});
