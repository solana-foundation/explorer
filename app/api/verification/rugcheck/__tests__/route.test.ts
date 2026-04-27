import fetch from 'node-fetch';
import { vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../[mintAddress]/route';

const VALID_MINT = 'B61SyRxF2b8JwSLZHgEUF6rtn6NUikkrK1EMEgP6nhXW';

vi.mock('node-fetch', async () => {
    const actual = await vi.importActual('node-fetch');
    return {
        ...actual,
        default: vi.fn(),
    };
});

const fetchMock = vi.mocked(fetch);

describe('Rugcheck API Route', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv, RUGCHECK_API_KEY: 'test-key' };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.clearAllMocks();
    });

    it('should return 400 for an invalid mint address', async () => {
        const response = await callRoute('not-a-valid-key');
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid mint address' });
    });

    it('should return 500 when API key is missing', async () => {
        delete process.env.RUGCHECK_API_KEY;
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Rugcheck API is misconfigured' });
    });

    it('should return 404 when rugcheck responds with 400 (not found)', async () => {
        mockFetchResponse(400, { error: 'not found' });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'No rugcheck data available' });
    });

    it('should return 422 when rugcheck responds with 400 (unable to generate report)', async () => {
        mockFetchResponse(400, { error: 'unable to generate report' });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(422);
        expect(await response.json()).toEqual({ error: 'No rugcheck data available' });
    });

    it('should return 404 when rugcheck responds with 400 (invalid token mint)', async () => {
        mockFetchResponse(400, { error: 'invalid token mint' });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'No rugcheck data available' });
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 400 and report to sentry when rugcheck responds with 400 and unexpected body', async () => {
        mockFetchResponse(400, { error: 'bad request' });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(400);
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should return 404 when rugcheck responds with 404', async () => {
        mockFetchResponse(404);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'No rugcheck data available' });
    });

    it('should return 429 and log to sentry when rate limited', async () => {
        mockFetchResponse(429);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(429);
        expect(Logger.warn).toHaveBeenCalledWith('[api:rugcheck] Rate limit exceeded', { sentry: true });
    });

    it('should return 502 when response schema is invalid', async () => {
        mockFetchResponse(200, { unexpected: 'shape' });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Invalid response from rugcheck API' });
    });

    it('should return score on success', async () => {
        mockFetchResponse(200, { score_normalised: 85 });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ score: 85 });
    });

    it('should return 500 when fetch throws', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Failed to fetch rugcheck data' });
    });
});

function mockFetchResponse(status: number, body: Record<string, unknown> = {}) {
    const ok = status >= 200 && status < 300;
    fetchMock.mockResolvedValueOnce({
        json: async () => body,
        ok,
        status,
    } as Awaited<ReturnType<typeof fetch>>);
}

function callRoute(mintAddress: string) {
    const request = new Request(`http://localhost:3000/api/verification/rugcheck/${mintAddress}`);
    return GET(request, { params: { mintAddress } });
}
