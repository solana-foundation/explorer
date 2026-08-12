import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MCP_ENDPOINT_PATH } from '../constants';
import { checkMcpHealth } from '../mcp-health';

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

const PONG = { id: 1, jsonrpc: '2.0', result: { content: [{ text: 'pong', type: 'text' }] } };

describe('checkMcpHealth', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    it('should report ready when the endpoint answers pong', async () => {
        fetchMock.mockResolvedValue(jsonResponse(PONG));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'ready' });
    });

    it('should call the endpoint with both required Accept media types', async () => {
        fetchMock.mockResolvedValue(jsonResponse(PONG));

        await checkMcpHealth();

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(MCP_ENDPOINT_PATH);
        expect(init?.headers).toMatchObject({ accept: 'application/json, text/event-stream' });
    });

    it('should report disabled when the endpoint is inert', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: 'MCP endpoint is disabled' }, 503));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'disabled' });
    });

    it('should report unreachable on a non-ok response', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unreachable' });
    });

    it('should report unreachable when the request fails', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unreachable' });
    });

    it('should report unreachable when the reply is not a pong', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: { code: -32601 }, id: 1, jsonrpc: '2.0' }));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unreachable' });
    });
});
