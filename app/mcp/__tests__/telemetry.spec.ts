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
    vi.stubEnv('MCP_GA_MEASUREMENT_ID', 'G-TEST123');
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
        expect(JSON.parse(init.body)).toMatchObject({ client_id: `sid_${expectedHash}` });
        expect(init.body).not.toContain('session-123');
    });

    it('should fall back to NEXT_PUBLIC_GOOGLE_ANALYTICS_ID when MCP_GA_MEASUREMENT_ID is unset', async () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-CLIENT');
        vi.stubEnv('MCP_GA_API_SECRET', 'secret');
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
        vi.stubGlobal('fetch', fetchMock);
        headersMock.mockResolvedValue(new Headers({ 'mcp-session-id': 'session-123' }));

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        expect(fetchMock).toHaveBeenCalledOnce();
        const [url] = fetchMock.mock.calls[0];
        expect(url).toContain('measurement_id=G-CLIENT');
    });

    // .env.example ships MCP_GA_MEASUREMENT_ID empty, so an empty value must fall back like an unset one.
    it('should fall back to NEXT_PUBLIC_GOOGLE_ANALYTICS_ID when MCP_GA_MEASUREMENT_ID is empty', async () => {
        vi.stubEnv('MCP_GA_MEASUREMENT_ID', '');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-CLIENT');
        vi.stubEnv('MCP_GA_API_SECRET', 'secret');
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
        vi.stubGlobal('fetch', fetchMock);
        headersMock.mockResolvedValue(new Headers());

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        const [url] = fetchMock.mock.calls[0];
        expect(url).toContain('measurement_id=G-CLIENT');
    });

    // The session branch returns early, so a request carrying both must never be keyed on its IP.
    it('should prefer the session id over the client ip when both are present', async () => {
        const fetchMock = stubGaEnv();
        headersMock.mockResolvedValue(new Headers({ 'mcp-session-id': 'session-123', 'x-forwarded-for': '1.2.3.4' }));

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        const expectedHash = createHash('sha256').update('session-123').digest('hex');
        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body)).toMatchObject({ client_id: `sid_${expectedHash}` });
        expect(init.body).not.toContain(createHash('sha256').update('1.2.3.4').digest('hex'));
    });

    it('should hash the client ip when no session id is present', async () => {
        const fetchMock = stubGaEnv();
        headersMock.mockResolvedValue(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }));

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        const expectedHash = createHash('sha256').update('1.2.3.4').digest('hex');
        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body)).toMatchObject({ client_id: `ip_${expectedHash}` });
        expect(init.body).not.toContain('1.2.3.4');
    });

    it('should fall back to an anonymous client id without session or ip', async () => {
        const fetchMock = stubGaEnv();
        headersMock.mockResolvedValue(new Headers());

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body)).toMatchObject({ client_id: 'anon' });
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
            '[mcp] MCP_GA_MEASUREMENT_ID (or NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) or MCP_GA_API_SECRET unset — usage analytics disabled',
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

    // Reported, not debug-logged: a rotated secret would otherwise leave the dashboards merely quiet.
    it('should report a failing headers lookup to Sentry and swallow it', async () => {
        stubGaEnv();
        headersMock.mockRejectedValue(new Error('no request scope'));

        createMcpTrack()(EVENT);
        await flushMicrotasks();

        expect(loggerMock.error).toHaveBeenCalledWith(expect.any(Error), { sentry: true });
    });
});
