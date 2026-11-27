import { getBase58Encoder } from '@solana/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The spec setup stubs `createSolanaRpc`, but these tests cover what kit does with a node's
// answer, so this file uses the real one and fakes the transport instead.
vi.unmock('@solana/kit');

import { stubRpcFetch } from '@/app/__tests__/rpc-fetch';
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

const { fetchMock, requestBody, respondWith, respondWithError } = stubRpcFetch();

afterEach(() => {
    vi.clearAllMocks();
});

describe('fetchAgGenesisCert', () => {
    it('should post the getAgGenesisCert call with no arguments', async () => {
        respondWith(null);

        await fetchAgGenesisCert(URL);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(URL);
        expect(init.method).toBe('POST');
        expect(requestBody()).toMatchObject({ jsonrpc: '2.0', method: 'getAgGenesisCert', params: [] });
    });

    // An accepted connection that never answers would otherwise hang forever.
    it('should bound the wait on the node', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');
        respondWith(null);

        await fetchAgGenesisCert(URL);

        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
        expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
        timeout.mockRestore();
    });

    it('should read a null result as an absent certificate', async () => {
        respondWith(null);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'absent' });
    });

    it('should read a certificate as a completed migration', async () => {
        respondWith(CERT);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({
            cert: { blockId: BLOCK_ID, slot: 460_012_345n },
            kind: 'present',
        });
    });

    it.each([
        ['the dedicated code', { code: -32601, message: 'Method not found' }],
        ['an internal error naming the method', { code: -32603, message: 'Method not found' }],
    ])('should read %s as the node not implementing the call', async (_label, error) => {
        respondWithError(error);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unsupported' });
    });

    // Some providers answer an unsupported method with a 404, and kit throws on the status before
    // the body is read, so the status is the only signal available.
    it('should read a 404 as the node not implementing the call', async () => {
        respondWithError({ code: -32603, message: 'Method not found' }, 404);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unsupported' });
    });

    // Some endpoints rate-limit this method alone while still serving others. Retrying makes the
    // limit worse.
    it('should return a rate limit as a settled answer rather than throw', async () => {
        respondWithError({ code: 429, message: 'Too many requests' }, 429);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // A bare 429 carries no JSON body, so the status is the only signal.
    it('should return a 429 with an HTML body as a refusal', async () => {
        fetchMock.mockResolvedValueOnce(new Response('<html>rate limited</html>', { status: 429 }));

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // A custom RPC has a wrong or missing key, and the next request carries the same key.
    it.each([
        ['401', 401],
        ['403', 403],
    ])('should carry an HTTP %s as a refusal, not a failure', async (_label, status) => {
        respondWithError({ message: 'unauthorized' }, status);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // A rate-limited node can still return a cached response, so the status is the stronger signal.
    it('should prefer a 429 status over a cached response body', async () => {
        respondWith(null, 429);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'refused' });
    });

    // A rate limit can be raised, unlike an unsupported method.
    it('should log a refusal but not an unsupported method', async () => {
        respondWithError({ code: 429, message: 'Too many requests' }, 429);
        await fetchAgGenesisCert(URL);
        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('refused'), expect.anything());

        vi.clearAllMocks();
        respondWithError({ code: -32601, message: 'Method not found' });
        await fetchAgGenesisCert(URL);
        expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should throw on an RPC error unrelated to the method', async () => {
        respondWithError({ code: -32005, message: 'Node is unhealthy' });

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('Node is unhealthy');
    });

    it('should throw on a 5xx', async () => {
        fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));

        await expect(fetchAgGenesisCert(URL)).rejects.toThrow('503');
    });

    // The node will answer the same way next time, so throwing would spend the retry budget on one
    // unchanging body.
    it.each([
        ['a block id the parser refuses', { block: { blockId: [1, 2, 3], slot: 1 } }],
        ['a bare string', 'not-a-cert'],
        ['an object with no block', { signature: { bitmap: [], signature: [] } }],
        ['an array', [1, 2, 3]],
        ['no result field at all', undefined],
    ])('should carry an answer that is %s as unreadable, not a failure', async (_label, result) => {
        respondWith(result);

        await expect(fetchAgGenesisCert(URL)).resolves.toEqual({ kind: 'unreadable' });
    });

    // Unlike an unsupported method, a malformed certificate is a bug worth logging.
    it('should record an unreadable certificate', async () => {
        respondWith({ block: { blockId: [1, 2, 3], slot: 1 } });

        await fetchAgGenesisCert(URL);

        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('not a certificate'), expect.anything());
    });
});
