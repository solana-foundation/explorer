import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchResource } from '../feature';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function mockJsonResponseOnce(data: unknown, contentType = 'application/json') {
    fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(data), {
            headers: { 'Content-Type': contentType },
        }),
    );
}

function mockResponseOnce(body: BodyInit | null, init?: ResponseInit) {
    fetchMock.mockResolvedValueOnce(new Response(body, init));
}

function mockRejectOnce<T extends Error>(error: T) {
    fetchMock.mockRejectedValueOnce(error);
}

describe('fetchResource', () => {
    const uri = 'http://hello.world/data.json';
    const headers = new Headers({ 'Content-Type': 'application/json' });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be called with proper arguments', async () => {
        mockJsonResponseOnce({}, 'application/json, charset=utf-8');

        const resource = await fetchResource(uri, headers, 100, 100);

        expect(fetchMock).toHaveBeenCalledWith(uri, expect.anything());
        expect(resource.data).toEqual({});
    });

    it('should throw exception for unsupported media', async () => {
        // Empty body with no recognized content-type → unsupported.
        mockResponseOnce(null);

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toThrowError('Unsupported Media Type');
    });

    it('should throw exception upon exceeded size when fetch rejects', async () => {
        mockRejectOnce(new Error('FetchError: content size at https://path/to/resour.ce over limit: 100'));

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toThrowError('Max Content Size Exceeded');
    });

    it('should throw exception when content-length exceeds limit', async () => {
        // Pre-check via Content-Length header — fast-fails before reading the body.
        const big = new Uint8Array(50_000);
        mockResponseOnce(big, {
            headers: { 'Content-Length': '50000', 'Content-Type': 'application/json' },
        });

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toThrowError('Max Content Size Exceeded');
    });

    it('should throw exception when streamed body exceeds limit without Content-Length', async () => {
        // Chunked response with no Content-Length — only the streaming counter in
        // readBodyWithLimit can catch the overflow.
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array(60));
                controller.enqueue(new Uint8Array(60));
                controller.close();
            },
        });
        fetchMock.mockResolvedValueOnce(
            new Response(stream, {
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toThrowError('Max Content Size Exceeded');
    });

    it('should handle AbortSignal', async () => {
        class TimeoutError extends Error {
            constructor() {
                super();
                this.name = 'TimeoutError';
            }
        }
        mockRejectOnce(new TimeoutError());

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toThrowError('Gateway Timeout');
    });

    it('should handle size overflow', async () => {
        mockRejectOnce(new Error('file is over limit: 100'));

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toThrowError('Max Content Size Exceeded');
    });

    it('should handle unexpected result', async () => {
        fetchMock.mockRejectedValueOnce({ data: 'unexpected exception' });

        const fn = () => {
            return fetchResource(uri, headers, 100, 100);
        };

        try {
            await fn();
        } catch (e: unknown) {
            const err = e as { message: string; status: number };
            expect(err.message).toEqual('General Error');
            expect(err.status).toEqual(500);
        }
    });

    it('should handle malformed JSON response gracefully', async () => {
        // Malformed JSON with a JSON content-type → 415 Unsupported Media Type.
        mockResponseOnce('<html>not json</html>', {
            headers: { 'Content-Type': 'application/json' },
        });

        await expect(fetchResource(uri, headers, 1000, 1000)).rejects.toThrowError('Unsupported Media Type');
    });
});
