import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { fetchNftokenMetadata } from '../fetch-nftoken-metadata';

const URI = 'https://cdn.glow.app/g/5e/rwwih1nsp8.json';
const VALID_CID_V0 = 'QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u';

const fetchMock = vi.fn();

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'false');
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('fetchNftokenMetadata', () => {
    it.each([
        ['an empty uri', ''],
        ['an unparseable uri', 'cdn.glow.app/a.json'],
        ['an ar:// uri', 'ar://rwwih1nsp8'],
        ['a javascript: uri', 'javascript:alert(1)'],
        ['a data: uri', 'data:application/json,{"name":"A"}'],
        ['an ipfs uri with a malformed CID', 'ipfs://not-a-cid'],
    ])('should settle %s as unavailable without a request', async (_, uri) => {
        await expect(fetchNftokenMetadata(uri)).resolves.toEqual({ kind: 'unavailable' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should request an ipfs uri through the HTTP gateway', async () => {
        respondWith({ name: 'A' });

        await fetchNftokenMetadata(`ipfs://${VALID_CID_V0}`);

        expect(fetchMock).toHaveBeenCalledWith(`https://ipfs.io/ipfs/${VALID_CID_V0}`, expect.anything());
    });

    it('should request through the metadata proxy when the proxy is enabled', async () => {
        vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
        respondWith({ name: 'A' });

        await fetchNftokenMetadata(URI);

        expect(fetchMock).toHaveBeenCalledWith(`/api/metadata/proxy?uri=${encodeURIComponent(URI)}`, expect.anything());
    });

    it('should skip the browser cache so a retry does not read a cached error', async () => {
        respondWith({ name: 'A' });

        await fetchNftokenMetadata(URI);

        expect(fetchMock).toHaveBeenCalledWith(URI, expect.objectContaining({ cache: 'no-store' }));
    });

    it('should abort the request at the route timeout', async () => {
        const deadline = new AbortController();
        const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
        respondWith({ name: 'A' });

        await fetchNftokenMetadata(URI);
        deadline.abort();

        expect(timeout).toHaveBeenCalledWith(ROUTE_TIMEOUT_MS);
        expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    });

    it('should parse a JSON object', async () => {
        respondWith({ image: 'https://cdn.glow.app/a.png', name: 'Genesis: friends.glow' });

        await expect(fetchNftokenMetadata(URI)).resolves.toEqual({
            kind: 'loaded',
            metadata: { image: 'https://cdn.glow.app/a.png', name: 'Genesis: friends.glow' },
        });
    });

    it.each([400, 401, 403, 404, 410, 413, 415])('should settle status %i as unavailable', async status => {
        respondWith({ error: 'error' }, { status });

        await expect(fetchNftokenMetadata(URI)).resolves.toEqual({ kind: 'unavailable' });
    });

    it('should settle a 502 from the metadata proxy as unavailable', async () => {
        vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
        respondWith({ error: 'Bad Gateway' }, { status: 502 });

        await expect(fetchNftokenMetadata(URI)).resolves.toEqual({ kind: 'unavailable' });
    });

    it.each([408, 429, 500, 503, 504])('should throw on status %i so the caller retries', async status => {
        respondWith({ error: 'error' }, { status });

        await expect(fetchNftokenMetadata(URI)).rejects.toThrow(String(status));
    });

    it('should throw when the request fails', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(fetchNftokenMetadata(URI)).rejects.toThrow('Failed to fetch');
    });

    it('should throw when the request times out', async () => {
        fetchMock.mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'));

        await expect(fetchNftokenMetadata(URI)).rejects.toThrow('timed out');
    });

    it.each([
        ['times out', new DOMException('The operation timed out.', 'TimeoutError')],
        ['is terminated', new TypeError('terminated')],
    ])('should throw when the body read %s', async (_, error) => {
        fetchMock.mockResolvedValueOnce(new Response(new ReadableStream({ start: body => body.error(error) })));

        await expect(fetchNftokenMetadata(URI)).rejects.toBe(error);
    });

    it('should settle a body that is not JSON as unavailable', async () => {
        fetchMock.mockResolvedValueOnce(new Response('<html>Not JSON</html>', { status: 200 }));

        await expect(fetchNftokenMetadata(URI)).resolves.toEqual({ kind: 'unavailable' });
    });

    it('should settle a JSON body that is not an object as unavailable', async () => {
        respondWith([{ name: 'A' }]);

        await expect(fetchNftokenMetadata(URI)).resolves.toEqual({ kind: 'unavailable' });
    });
});

function respondWith(body: unknown, { status = 200 }: { status?: number } = {}) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
}
