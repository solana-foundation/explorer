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

    it('should measure the round trip when the endpoint answers pong', async () => {
        fetchMock.mockResolvedValue(jsonResponse(PONG));

        const health = await checkMcpHealth();

        expect(health.status).toBe('ready');
        expect(health).toHaveProperty('latencyMs', expect.any(Number));
    });

    // The ping envelope is the causal signal: drift to `initialize` still answers 200 and would read as "unreachable".
    it('should post the ping tool-call envelope with both required Accept media types', async () => {
        fetchMock.mockResolvedValue(jsonResponse(PONG));

        await checkMcpHealth();

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(MCP_ENDPOINT_PATH);
        expect(init?.method).toBe('POST');
        expect(init?.headers).toMatchObject({ accept: 'application/json, text/event-stream' });
        expect(JSON.parse(String(init?.body))).toMatchObject({
            method: 'tools/call',
            params: { arguments: {}, name: 'ping' },
        });
    });

    it('should abort the request rather than hang indefinitely', async () => {
        fetchMock.mockResolvedValue(jsonResponse(PONG));

        await checkMcpHealth();

        expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    });

    it('should report disabled when the endpoint is inert', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: 'MCP endpoint is disabled' }, 503));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'disabled' });
    });

    it('should report unauthorized when the deployment requires a bearer key', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unauthorized' });
    });

    it('should report unauthorized when the caller is blocked', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: 'Forbidden' }, 403));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unauthorized' });
    });

    it('should report unreachable on any other non-ok response', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: 'Internal error' }, 500));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unreachable' });
    });

    it('should report unreachable when the request fails', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unreachable' });
    });

    it('should report unreachable when the request times out', async () => {
        const timeout = new Error('timed out');
        timeout.name = 'TimeoutError';
        fetchMock.mockRejectedValue(timeout);

        await expect(checkMcpHealth()).resolves.toMatchObject({
            reason: expect.stringContaining('in time'),
            status: 'unreachable',
        });
    });

    // A 200 that is not a pong means our own tool contract broke — worth telling apart from a dead endpoint.
    it('should report degraded when the endpoint answers a JSON-RPC error', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: { code: -32601 }, id: 1, jsonrpc: '2.0' }));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'degraded' });
    });

    it('should report degraded when the tool replies without pong', async () => {
        const body = { id: 1, jsonrpc: '2.0', result: { content: [{ text: 'MCP error -32602' }], isError: true } };
        fetchMock.mockResolvedValue(jsonResponse(body));

        await expect(checkMcpHealth()).resolves.toMatchObject({ cause: body, status: 'degraded' });
    });

    it('should report unreachable when a 200 carries a non-JSON body', async () => {
        fetchMock.mockResolvedValue(new Response('<html>gateway error</html>', { status: 200 }));

        await expect(checkMcpHealth()).resolves.toMatchObject({ status: 'unreachable' });
    });
});
