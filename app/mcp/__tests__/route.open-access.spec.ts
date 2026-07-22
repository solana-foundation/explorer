import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { POST } from '../route';

vi.hoisted(() => {
    delete process.env.MCP_ACCESS_KEYS;
    delete process.env.MCP_BLOCKED_IPS;
    process.env.MCP_ENDPOINT_ENABLED = 'true';
});

const { handlerMock } = vi.hoisted(() => ({ handlerMock: vi.fn() }));

vi.mock('../dependencies', () => ({
    getMcpRequestHandler: async () => handlerMock,
}));

describe('POST /mcp — MCP_ACCESS_KEYS unset (open access)', () => {
    beforeEach(() => {
        // No clearAllMocks here — it would erase the module-scope Logger.warn recorded at import time.
        handlerMock.mockReset();
        handlerMock.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    });

    it('should log a startup warning that authentication is disabled', () => {
        expect(vi.mocked(Logger.warn)).toHaveBeenCalledWith(
            '[mcp] MCP_ACCESS_KEYS is unset — /mcp is enabled without authentication',
        );
    });

    it('should serve requests without an Authorization header', async () => {
        const request = new Request('http://localhost:3000/mcp', {
            body: '{}',
            headers: { 'content-type': 'application/json' },
            method: 'POST',
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(handlerMock).toHaveBeenCalledWith(request);
    });
});
