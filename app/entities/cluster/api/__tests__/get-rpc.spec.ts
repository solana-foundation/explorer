import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

// The client cache is module state, so each test loads a fresh copy of the module.
async function loadModule() {
    vi.resetModules();
    return import('../get-rpc');
}

describe('getRpc', () => {
    // A client boundary here makes every server caller — the receipt OG route among them — throw
    // "getRpc is on the client" instead of fetching. Vitest cannot enforce the boundary, so assert
    // on the source.
    it('should stay callable from server code', () => {
        const source = readFileSync(path.resolve(__dirname, '../get-rpc.ts'), 'utf8');
        const lines = source.split('\n').map(line => line.trim());
        // A directive only takes effect as the module's first statement, so that is what to inspect.
        const firstStatement = lines.find(line => line !== '' && !line.startsWith('//')) ?? '';

        expect(firstStatement).not.toContain('use client');
    });

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
