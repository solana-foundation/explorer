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

type Transport = Parameters<Awaited<ReturnType<typeof loadModule>>['withAbortSignal']>[0];
type TransportConfig = Parameters<Transport>[0];

const PAYLOAD = { jsonrpc: '2.0', method: 'getAccountInfo', params: [] };

/** Stands in for the HTTP transport, recording the config it was handed instead of sending anything. */
function recordingTransport() {
    const calls: TransportConfig[] = [];
    const transport = (config: TransportConfig) => {
        calls.push(config);
        return Promise.resolve({ json: undefined });
    };
    return { calls, transport: transport as unknown as Transport };
}

describe('withAbortSignal', () => {
    it('should attach the deadline to a request that carried no signal', async () => {
        const { withAbortSignal } = await loadModule();
        const { calls, transport } = recordingTransport();
        const { signal } = new AbortController();

        await withAbortSignal(transport, signal)({ payload: PAYLOAD });

        expect(calls[0]).toEqual({ payload: PAYLOAD, signal });
    });

    it('should abort the request the deadline was attached to', async () => {
        const { withAbortSignal } = await loadModule();
        const { calls, transport } = recordingTransport();
        const deadline = new AbortController();

        await withAbortSignal(transport, deadline.signal)({ payload: PAYLOAD });
        deadline.abort();

        expect(calls[0]?.signal?.aborted).toBe(true);
    });

    it("should keep the request's own signal alongside the deadline", async () => {
        const { withAbortSignal } = await loadModule();
        const { calls, transport } = recordingTransport();
        const perRequest = new AbortController();
        const deadline = new AbortController();

        await withAbortSignal(transport, deadline.signal)({ payload: PAYLOAD, signal: perRequest.signal });
        // Either one firing has to cancel: dropping the request's own signal would strip a cancellation the
        // caller had already asked for.
        perRequest.abort();

        expect(calls[0]?.signal?.aborted).toBe(true);
        expect(deadline.signal.aborted).toBe(false);
    });
});

describe('createAbortableRpc', () => {
    it('should not share a cached client with getRpc, since the signal is per caller', async () => {
        const { createAbortableRpc, getRpc } = await loadModule();
        const url = 'http://localhost:8899';
        const { signal } = new AbortController();

        expect(createAbortableRpc(url, signal)).not.toBe(getRpc(url));
        expect(createAbortableRpc(url, signal)).not.toBe(createAbortableRpc(url, signal));
    });
});
