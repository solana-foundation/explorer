import fetch, { Headers } from 'node-fetch';
import { vi } from 'vitest';

import { fetchResource } from '../feature';

vi.mock('node-fetch', async () => {
    const actual = await vi.importActual('node-fetch');
    return {
        ...actual,
        default: vi.fn()
    };
});

/**
 *  mock valid response
 */
function mockFetchOnce(data: any = {}, headers: Headers = new Headers()) {
    // @ts-expect-error fetch does not have mocked fn
    fetch.mockResolvedValueOnce({
        headers,
        json: async () => data
    });
}

/**
 *  mock error during process
 */
function mockRejectOnce<T extends Error>(error: T) {
    // @ts-expect-error fetch does not have mocked fn
    fetch.mockRejectedValueOnce(error);
}

describe('fetchResource', () => {
    const uri = 'http://hello.world/data.json';
    const headers = new Headers({ 'Content-Type': 'application/json' });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be called with proper arguments', async () => {
        mockFetchOnce({}, new Headers({ 'Content-Type': 'application/json, charset=utf-8' }));

        const resource = await fetchResource(uri, headers, 100, 100);

        expect(fetch).toHaveBeenCalledWith(uri, expect.anything());
        expect(resource.data).toEqual({});
    });

    it('should throw exception for unsupported media', async () => {
        mockFetchOnce();

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toThrowError('Unsupported Media Type');
    });

    it('should throw exception upon exceeded size', async () => {
        mockRejectOnce(new Error('FetchError: content size at https://path/to/resour.ce over limit: 100'));

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
        // @ts-expect-error fetch does not have mocked fn
        fetch.mockRejectedValueOnce({ data: "unexpected exception" });

        const fn = () => {
            return fetchResource(uri, headers, 100, 100);
        };

        try {
            await fn();
        } catch (e: any) {
            expect(e.message).toEqual('General Error');
            expect(e.status).toEqual(500);
        }
    });

    it('should handle malformed JSON response gracefully', async () => {
        // Mock fetch to return a response with invalid JSON
        // @ts-expect-error fetch does not have mocked fn
        fetch.mockResolvedValueOnce({
            headers: new Headers({ 'Content-Type': 'application/json' }),
            // Simulate malformed JSON by rejecting during json parsing
            json: async () => { throw new SyntaxError('Unexpected token < in JSON at position 0'); }
        });

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toThrowError('Unsupported Media Type');
    });
});
