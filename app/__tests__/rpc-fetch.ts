import { afterEach, beforeEach, vi } from 'vitest';

/**
 * Serves JSON-RPC responses to the real kit client through a stubbed global `fetch`.
 * The calling spec must also undo the global `@solana/kit` mock, or kit never reaches `fetch`.
 */
export function stubRpcFetch() {
    const fetchMock = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    function respondWith(result: unknown) {
        const body = JSON.stringify({ id: 1, jsonrpc: '2.0', result });
        // kit reads the body as text so it can upcast integers to bigints as it parses.
        fetchMock.mockResolvedValueOnce({ ok: true, status: 200, text: async () => body });
    }

    function requestBody() {
        return JSON.parse(fetchMock.mock.calls[0][1].body);
    }

    return { fetchMock, requestBody, respondWith };
}
