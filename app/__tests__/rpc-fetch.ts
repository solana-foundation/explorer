import { afterEach, beforeEach, vi } from 'vitest';

export function stubFetch() {
    const fetchMock = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    function respondWith(status: number, body: unknown) {
        fetchMock.mockResolvedValueOnce(Response.json(body, { status }));
    }

    return { fetchMock, respondWith };
}

/**
 * Serves JSON-RPC responses to the real kit client through a stubbed global `fetch`.
 * The calling spec must also undo the global `@solana/kit` mock, or kit never reaches `fetch`.
 */
export function stubRpcFetch() {
    const { fetchMock, respondWith } = stubFetch();

    function requestBody() {
        return JSON.parse(fetchMock.mock.calls[0][1].body);
    }

    return {
        fetchMock,
        requestBody,
        respondWith: (result: unknown, status = 200) => respondWith(status, { id: 1, jsonrpc: '2.0', result }),
        respondWithError: (error: unknown, status = 200) => respondWith(status, { error, id: 1, jsonrpc: '2.0' }),
    };
}
