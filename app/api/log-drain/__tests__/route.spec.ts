import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '../route';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn(), panic: vi.fn(), warn: vi.fn() },
}));

const SECRET = 'drain-secret';
const VERIFY = 'verify-key';

const event = (overrides: Record<string, unknown>) =>
    JSON.stringify({ level: 'info', message: 'hello', source: 'lambda', timestamp: 1_700_000_000_000, ...overrides });

describe('log-drain route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VERCEL_DRAIN_SECRET', SECRET);
        vi.stubEnv('VERCEL_LOG_DRAIN_VERIFY', VERIFY);
        vi.stubEnv('GRAFANA_LOKI_URL', 'https://loki.example');
        vi.stubEnv('GRAFANA_LOKI_USER', '42');
        vi.stubEnv('GRAFANA_LOKI_TOKEN', 'token');
        vi.stubEnv('VERCEL_ENV', 'production');
        fetchMock.mockResolvedValue({ ok: true, text: async () => '' });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should carry the verification key on GET', async () => {
        const response = GET();

        expect(response.status).toBe(200);
        expect(response.headers.get('x-vercel-verify')).toBe(VERIFY);
    });

    it('should refuse a wrong drain secret and still carry the verification key', async () => {
        const response = await post('{}', { 'x-vercel-drain-secret': 'wrong' });

        expect(response.status).toBe(403);
        expect(response.headers.get('x-vercel-verify')).toBe(VERIFY);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should answer 500 when the drain secret is not configured', async () => {
        vi.stubEnv('VERCEL_DRAIN_SECRET', '');

        const response = await post('{}');

        expect(response.status).toBe(500);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should accept an empty body without pushing', async () => {
        const response = await post('  \n');

        expect(response.status).toBe(204);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should group events into one stream per source and level and skip malformed lines', async () => {
        const body = [
            event({ level: 'error', source: 'lambda' }),
            event({ level: 'info', source: 'lambda' }),
            event({ level: 'ERROR', source: 'lambda' }),
            event({ level: 'debug', source: 'edge' }),
            'not json',
        ].join('\n');

        const response = await post(body);

        expect(response.status).toBe(204);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://loki.example/loki/api/v1/push');
        expect(init.headers.Authorization).toBe(`Basic ${Buffer.from('42:token').toString('base64')}`);
        const { streams } = JSON.parse(init.body);
        const byKey = Object.fromEntries(
            streams.map((s: { stream: Record<string, string>; values: unknown[] }) => [
                `${s.stream.source}|${s.stream.level}`,
                s,
            ]),
        );
        expect(Object.keys(byKey).sort()).toEqual(['edge|info', 'lambda|error', 'lambda|info']);
        expect(byKey['lambda|error'].values).toHaveLength(2);
        expect(byKey['lambda|error'].stream).toEqual({
            env: 'prd',
            level: 'error',
            service: 'explorer',
            source: 'lambda',
        });
        expect(byKey['lambda|error'].values[0]).toEqual([
            '1700000000000000000',
            event({ level: 'error', source: 'lambda' }),
        ]);
    });

    it('should answer 502 when Loki rejects the push', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'invalid authentication credentials' });

        const response = await post(event({}));

        expect(response.status).toBe(502);
        expect(response.headers.get('x-vercel-verify')).toBe(VERIFY);
    });

    it('should answer 502 when the Loki credentials are not configured', async () => {
        vi.stubEnv('GRAFANA_LOKI_TOKEN', '');

        const response = await post(event({}));

        expect(response.status).toBe(502);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

async function post(body: string, headers: Record<string, string> = { 'x-vercel-drain-secret': SECRET }) {
    return POST(new Request('https://explorer.solana.com/api/log-drain', { body, headers, method: 'POST' }));
}
