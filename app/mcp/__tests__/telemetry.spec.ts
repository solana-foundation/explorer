import { createHash } from 'node:crypto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMcpTrack } from '../telemetry';

const { afterMock, headersMock, loggerMock } = vi.hoisted(() => ({
    afterMock: vi.fn((callback: () => Promise<void>) => {
        void callback();
    }),
    headersMock: vi.fn(),
    loggerMock: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('next/server', () => ({ after: afterMock }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: loggerMock }));

const EVENT = { name: 'mcp_tool_call', params: { duration_ms: 1, status: 'success', tool: 'ping' } } as const;

function flushMicrotasks(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

function stubGaEnv(): ReturnType<typeof vi.fn> {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-TEST123');
    vi.stubEnv('MCP_GA_API_SECRET', 'secret');
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

describe('createMcpTrack', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('should send the event after the response using the hashed mcp session id as the client id', async () => {
        const fetchMock = stubGaEnv();
        headersMock.mockResolvedValue(new Headers({ 'mcp-session-id': 'session-123' }));

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        expect(afterMock).toHaveBeenCalledTimes(1);
        const expectedHash = createHash('sha256').update('session-123').digest('hex');
        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body)).toMatchObject({ client_id: expectedHash });
        expect(init.body).not.toContain('session-123');
    });

    it('should hash the client ip when no session id is present', async () => {
        const fetchMock = stubGaEnv();
        headersMock.mockResolvedValue(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }));

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        const expectedHash = createHash('sha256').update('1.2.3.4').digest('hex');
        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body)).toMatchObject({ client_id: expectedHash });
        expect(init.body).not.toContain('1.2.3.4');
    });

    it('should fall back to an anonymous client id without session or ip', async () => {
        const fetchMock = stubGaEnv();
        headersMock.mockResolvedValue(new Headers());

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body)).toMatchObject({ client_id: 'anonymous' });
    });

    it('should warn once and stay a no-op when the GA credentials are not configured', async () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', '');
        vi.stubEnv('MCP_GA_API_SECRET', '');
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        headersMock.mockResolvedValue(new Headers());

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(loggerMock.warn).toHaveBeenCalledWith(
            '[mcp] NEXT_PUBLIC_GOOGLE_ANALYTICS_ID or MCP_GA_API_SECRET unset — usage analytics disabled',
        );
    });

    it('should warn when only one of the GA credentials is configured', async () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-TEST123');
        vi.stubEnv('MCP_GA_API_SECRET', '');
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        headersMock.mockResolvedValue(new Headers());

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(loggerMock.warn).toHaveBeenCalled();
    });

    it('should not warn when both GA credentials are configured', async () => {
        stubGaEnv();
        headersMock.mockResolvedValue(new Headers());

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    it('should log at debug and swallow a failing headers lookup', async () => {
        stubGaEnv();
        headersMock.mockRejectedValue(new Error('no request scope'));

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        expect(loggerMock.debug).toHaveBeenCalledWith('[mcp] telemetry emission failed', {
            error: expect.any(Error),
        });
    });
});
