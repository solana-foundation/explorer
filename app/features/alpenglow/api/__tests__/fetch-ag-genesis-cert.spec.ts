import { getBase58Encoder } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { fetchAgGenesisCert } from '../fetch-ag-genesis-cert';

const URL = toConnectableUrl('https://mock.rpc');
const BLOCK_ID = 'HnvmbDUEbrmuj3mYAA1EKGGzpZRuFRgMRPwtsgGFadmn';

const CERT = {
    block: { blockId: [...getBase58Encoder().encode(BLOCK_ID)], slot: 460_012_345 },
    signature: { bitmap: [255, 3], signature: [1, 2, 3] },
};

const fetchMock = vi.fn();

function respondWith(body: unknown, { ok = true, status = 200 }: { ok?: boolean; status?: number } = {}) {
    fetchMock.mockResolvedValueOnce({ json: async () => body, ok, status });
}

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('fetchAgGenesisCert', () => {
    it('should post the getAgGenesisCert call with no params', async () => {
        respondWith({ id: 1, jsonrpc: '2.0', result: null });

        await fetchAgGenesisCert(URL);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(URL);
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ id: 1, jsonrpc: '2.0', method: 'getAgGenesisCert' });
    });

    // A connection accepted and never answered would otherwise leave the card waiting for good.
    it('should bound the wait on the node', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');
        respondWith({ id: 1, jsonrpc: '2.0', result: null });

        await fetchAgGenesisCert(URL);

        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
        timeout.mockRestore();
    });

    it('should read a null result as "no certificate yet"', async () => {
        respondWith({ id: 1, jsonrpc: '2.0', result: null });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'absent' });
    });

    it('should read a certificate as the migration having happened', async () => {
        respondWith({ id: 1, jsonrpc: '2.0', result: CERT });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({
            cert: { blockId: BLOCK_ID, slot: 460_012_345n },
            kind: 'present',
        });
    });

    it.each([
        ['the dedicated code', { code: -32601, message: 'Method not found' }],
        ['an internal error naming the method', { code: -32603, message: 'Method not found' }],
    ])('should read %s as the node not implementing the call', async (_label, error) => {
        respondWith({ error, id: 1, jsonrpc: '2.0' });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unsupported' });
    });

    // Endpoints disagree on the status that carries this, so the body has to be read before it.
    // Both are observed: Agave answers 200, Helius answers 404.
    it.each([
        ['200', { ok: true, status: 200 }],
        ['404', { ok: false, status: 404 }],
    ])('should classify a method-not-found answer arriving with HTTP %s', async (_label, http) => {
        respondWith({ error: { code: -32603, message: 'Method not found' }, id: 1, jsonrpc: '2.0' }, http);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unsupported' });
    });

    // Observed on explorer-api.mainnet-beta, which answers getEpochInfo from the same caller in the
    // same second. Retrying is the one thing that cannot help: the retries are what is limited.
    it.each([
        ['the error body', { error: { code: 429, message: 'Too many requests for a specific RPC call' }, id: 1 }, 429],
        ['the HTTP status alone', { error: { message: 'Too many requests' }, id: 1 }, 429],
    ])('should carry a rate-limit refusal from %s as an answer, not a failure', async (_label, body, status) => {
        respondWith(body, { ok: false, status });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // Whatever stands in front of a node answers a bare 429, often with an HTML page — so there is
    // no error body to read, and the status is the only signal that retrying cannot help.
    it.each([
        [
            'an unreadable body',
            async () => {
                throw new Error('not json');
            },
        ],
        ['an HTML body', async () => '<html>rate limited</html>'],
    ])('should carry a 429 with %s as a refusal', async (_label, json) => {
        fetchMock.mockResolvedValueOnce({ json, ok: false, status: 429 });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // A wrong or missing key on a custom RPC. Retrying spends three more attempts on the same wall.
    it.each([
        ['401', 401],
        ['403', 403],
    ])('should carry an HTTP %s as a refusal, not a failure', async (_label, status) => {
        respondWith({ error: { message: 'unauthorized' }, id: 1 }, { ok: false, status });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // `'result' in body` cannot be pointed at a primitive, and a proxy can answer 200 with one.
    it.each([
        ['a bare string', 'hello'],
        ['a bare number', 42],
    ])('should reject %s at HTTP 200 as malformed, not crash on it', async (_label, value) => {
        respondWith(value);

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('malformed response');
    });

    // A limit is something a person can raise, unlike a node that simply predates the method.
    it('should record a refusal and stay quiet about an unimplemented method', async () => {
        respondWith({ error: { code: 429, message: 'Too many requests' }, id: 1 }, { ok: false, status: 429 });
        await fetchAgGenesisCert(URL);
        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('rate-limited'), expect.anything());

        vi.clearAllMocks();
        respondWith({ error: { code: -32601, message: 'Method not found' }, id: 1 });
        await fetchAgGenesisCert(URL);
        expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should throw on an RPC error that is not about the method', async () => {
        respondWith({ error: { code: -32005, message: 'Node is unhealthy' }, id: 1, jsonrpc: '2.0' });

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('Node is unhealthy');
    });

    it('should throw on an HTTP failure carrying no RPC error', async () => {
        respondWith(undefined, { ok: false, status: 503 });

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('HTTP 503');
    });

    it('should throw when the answer carries no result at all', async () => {
        respondWith({ id: 1, jsonrpc: '2.0' });

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('malformed response');
    });

    // Some implementations send `error: null` alongside a valid result. Reading that as an error
    // would reject every good answer from such a node.
    it('should not read a null error beside a result as a failure', async () => {
        respondWith({ error: null, id: 1, jsonrpc: '2.0', result: null });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'absent' });
    });

    // An endpoint is free to put anything in `error`. What matters is that the reason survives into
    // the message a person will read, rather than becoming "[object Object]" or being lost entirely.
    it.each([
        ['a nested object', { code: -32005, message: { nested: 'boom' } }, 'RPC error'],
        ['a bare string', 'something broke', 'something broke'],
        ['no message at all', { code: -32005 }, 'RPC error'],
    ])('should surface an error carrying %s without losing the diagnostic', async (_label, error, expected) => {
        respondWith({ error, id: 1 });

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow(expected);
    });

    // The status is the stronger signal: a node behind a limiter can echo a cached-looking body.
    it('should prefer a 429 status over a result the body still carries', async () => {
        respondWith({ id: 1, result: null }, { ok: false, status: 429 });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    it.each([
        ['null', null],
        ['an array', [1, 2, 3]],
    ])('should reject a body that is %s', async (_label, body) => {
        respondWith(body);

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow();
    });

    // The node answered, and will answer the same way next time. Throwing would spend the caller's
    // whole retry budget re-reading one body.
    it.each([
        ['a block id the parser refuses', { block: { blockId: [1, 2, 3], slot: 1 } }],
        ['a bare string', 'not-a-cert'],
        ['an object with no block', { signature: { bitmap: [], signature: [] } }],
    ])('should carry a result that is %s as unreadable, not a failure', async (_label, result) => {
        respondWith({ id: 1, jsonrpc: '2.0', result });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unreadable' });
    });

    // Unlike a node that simply predates the method, a node minting a certificate this app cannot
    // read is someone's bug.
    it('should record an unreadable certificate', async () => {
        respondWith({ id: 1, jsonrpc: '2.0', result: { block: { blockId: [1, 2, 3], slot: 1 } } });

        await fetchAgGenesisCert(URL);

        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('not a certificate'), expect.anything());
    });
});
