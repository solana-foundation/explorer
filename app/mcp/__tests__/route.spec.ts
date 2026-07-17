import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { OPTIONS, POST } from '../route';

vi.hoisted(() => {
    process.env.MCP_ACCESS_KEYS = 'test-key, spare-key';
    process.env.MCP_BLOCKED_IPS = '203.0.113.7';
    process.env.MCP_ENDPOINT_ENABLED = 'true';
});

const { handlerMock } = vi.hoisted(() => ({ handlerMock: vi.fn() }));

vi.mock('../dependencies', () => ({
    getMcpRequestHandler: async () => handlerMock,
}));

function makeRequest(init?: { authorization?: string; ip?: string }) {
    const headers = new Headers({ 'content-type': 'application/json' });
    if (init?.authorization) headers.set('authorization', init.authorization);
    if (init?.ip) headers.set('x-forwarded-for', init.ip);
    return new Request('http://localhost:3000/mcp', { body: '{}', headers, method: 'POST' });
}

describe('POST /mcp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        handlerMock.mockResolvedValue(
            new Response('{"ok":true}', { headers: { 'mcp-session-id': 'session-1' }, status: 200 }),
        );
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should return 403 for a blacklisted IP without invoking the MCP handler', async () => {
        const response = await POST(makeRequest({ authorization: 'Bearer test-key', ip: '203.0.113.7, 10.0.0.1' }));

        expect(response.status).toBe(403);
        expect(handlerMock).not.toHaveBeenCalled();
        expect(vi.mocked(Logger.warn)).toHaveBeenCalledWith('[mcp] rejected request from blocked ip', {
            clientIp: '203.0.113.7',
        });
    });

    it('should return 503 with a disabled message when the endpoint flag is off', async () => {
        vi.stubEnv('MCP_ENDPOINT_ENABLED', 'false');

        const response = await POST(makeRequest({ authorization: 'Bearer test-key' }));

        expect(response.status).toBe(503);
        expect(handlerMock).not.toHaveBeenCalled();
        await expect(response.json()).resolves.toEqual({ error: 'MCP endpoint is disabled' });
    });

    it('should return 401 when the Authorization header is missing', async () => {
        const response = await POST(makeRequest());

        expect(response.status).toBe(401);
        expect(handlerMock).not.toHaveBeenCalled();
        await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 for a key outside the allow-list', async () => {
        const response = await POST(makeRequest({ authorization: 'Bearer wrong-key' }));

        expect(response.status).toBe(401);
        expect(handlerMock).not.toHaveBeenCalled();
    });

    it('should delegate to the MCP handler and append CORS headers for a valid key', async () => {
        const request = makeRequest({ authorization: 'Bearer spare-key' });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(handlerMock).toHaveBeenCalledWith(request);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('mcp-session-id')).toBe('session-1');
        await expect(response.json()).resolves.toEqual({ ok: true });
    });
});

describe('OPTIONS /mcp', () => {
    it('should return 204 with CORS headers', () => {
        const response = OPTIONS();

        expect(response.status).toBe(204);
        expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
});
