import type * as SolanaKit from '@solana/kit';
import { getBase58Encoder } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The spec setup stubs `createSolanaRpc` so no test reaches a real node. Everything here is about
// what kit does with a node's answer, so this file needs the real one and fakes the wire instead.
vi.mock('@solana/kit', async () => await vi.importActual<typeof SolanaKit>('@solana/kit'));

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

/** A real `Response`, so no test can pass against a shape `fetch` would never hand kit. */
function respondWith(body: unknown, { status = 200 }: { status?: number } = {}) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
}

function respondWithRaw(body: string, { status = 200 }: { status?: number } = {}) {
    fetchMock.mockResolvedValueOnce(new Response(body, { status }));
}

function rpcError(error: unknown) {
    return { error, id: '0', jsonrpc: '2.0' };
}

function rpcResult(result: unknown) {
    return { id: '0', jsonrpc: '2.0', result };
}

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('fetchAgGenesisCert', () => {
    it('should post the getAgGenesisCert call with no arguments', async () => {
        respondWith(rpcResult(null));

        await fetchAgGenesisCert(URL);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(URL);
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toMatchObject({ jsonrpc: '2.0', method: 'getAgGenesisCert', params: [] });
    });

    // A connection accepted and never answered would otherwise leave the card waiting for good.
    it('should bound the wait on the node', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');
        respondWith(rpcResult(null));

        await fetchAgGenesisCert(URL);

        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
        expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
        timeout.mockRestore();
    });

    it('should read a null result as "no certificate yet"', async () => {
        respondWith(rpcResult(null));

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'absent' });
    });

    it('should read a certificate as the migration having happened', async () => {
        respondWith(rpcResult(CERT));

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({
            cert: { blockId: BLOCK_ID, slot: 460_012_345n },
            kind: 'present',
        });
    });

    it.each([
        ['the dedicated code', { code: -32601, message: 'Method not found' }],
        ['an internal error naming the method', { code: -32603, message: 'Method not found' }],
    ])('should read %s as the node not implementing the call', async (_label, error) => {
        respondWith(rpcError(error));

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unsupported' });
    });

    // Helius answers a method it does not serve with a 404, and kit throws on the status before the
    // body saying so is read — so the status is the only signal left, and it has to be enough.
    it('should read a 404 as the node not implementing the call', async () => {
        respondWith(rpcError({ code: -32603, message: 'Method not found' }), { status: 404 });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unsupported' });
    });

    // Observed on explorer-api.mainnet-beta, which answers getEpochInfo from the same caller in the
    // same second. Retrying is the one thing that cannot help: the retries are what is limited.
    it('should carry a rate limit as an answer, not a failure', async () => {
        respondWith(rpcError({ code: 429, message: 'Too many requests' }), { status: 429 });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // Whatever stands in front of a node answers a bare 429, often with an HTML page — so there is
    // no JSON to read, and the status is the only signal that retrying cannot help.
    it('should carry a 429 carrying an HTML page as a refusal', async () => {
        respondWithRaw('<html>rate limited</html>', { status: 429 });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // A wrong or missing key on a custom RPC. Retrying spends three more attempts on the same wall.
    it.each([
        ['401', 401],
        ['403', 403],
    ])('should carry an HTTP %s as a refusal, not a failure', async (_label, status) => {
        respondWith(rpcError({ message: 'unauthorized' }), { status });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // The status is the stronger signal: a node behind a limiter can echo a cached-looking body.
    it('should prefer a 429 status over a result the body still carries', async () => {
        respondWith(rpcResult(null), { status: 429 });

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // A limit is something a person can raise, unlike a node that simply predates the method.
    it('should record a refusal and stay quiet about an unimplemented method', async () => {
        respondWith(rpcError({ code: 429, message: 'Too many requests' }), { status: 429 });
        await fetchAgGenesisCert(URL);
        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('refused'), expect.anything());

        vi.clearAllMocks();
        respondWith(rpcError({ code: -32601, message: 'Method not found' }));
        await fetchAgGenesisCert(URL);
        expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should throw on an RPC error that is not about the method', async () => {
        respondWith(rpcError({ code: -32005, message: 'Node is unhealthy' }));

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('Node is unhealthy');
    });

    it('should throw on a 5xx', async () => {
        respondWithRaw('', { status: 503 });

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('503');
    });

    // The node answered, and will answer the same way next time. Throwing would spend the caller's
    // whole retry budget re-reading one body.
    it.each([
        ['a block id the parser refuses', rpcResult({ block: { blockId: [1, 2, 3], slot: 1 } })],
        ['a bare string', rpcResult('not-a-cert')],
        ['an object with no block', rpcResult({ signature: { bitmap: [], signature: [] } })],
        ['an array', rpcResult([1, 2, 3])],
        ['no result field at all', { id: '0', jsonrpc: '2.0' }],
    ])('should carry an answer that is %s as unreadable, not a failure', async (_label, body) => {
        respondWith(body);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unreadable' });
    });

    // Unlike a node that simply predates the method, a node minting a certificate this app cannot
    // read is someone's bug.
    it('should record an unreadable certificate', async () => {
        respondWith(rpcResult({ block: { blockId: [1, 2, 3], slot: 1 } }));

        await fetchAgGenesisCert(URL);

        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('not a certificate'), expect.anything());
    });
});
