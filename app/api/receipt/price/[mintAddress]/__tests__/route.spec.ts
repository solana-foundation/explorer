import fetch from 'node-fetch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, JUPITER_PRICE_ENDPOINT, NO_STORE_HEADERS } from '../config';

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: {
        error: vi.fn(),
        panic: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock('node-fetch', () => ({
    default: vi.fn(),
}));

const VALID_MINT = 'So11111111111111111111111111111111111111112';
const mockRequest = new Request(`http://localhost:3000/api/receipt/price/${VALID_MINT}`);

describe('GET /api/receipt/price/[mintAddress]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('JUPITER_API_KEY', 'test-api-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('validation', () => {
        it('returns 400 for an invalid mint address', async () => {
            const { GET } = await import('../route');
            const response = await GET(mockRequest, { params: { mintAddress: 'not-a-valid-pubkey' } });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data).toEqual({ error: 'Invalid mint address' });
        });
    });

    describe('missing API key', () => {
        it('returns 500 when JUPITER_API_KEY is not set', async () => {
            vi.unstubAllEnvs();
            vi.stubEnv('JUPITER_API_KEY', '');
            vi.resetModules();
            const { GET } = await import('../route');

            const response = await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toEqual({ error: 'Jupiter API is misconfigured' });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });
    });

    describe('Jupiter API errors', () => {
        it('returns 429 and calls Logger.warn on rate limit', async () => {
            vi.resetModules();
            const { GET } = await import('../route');
            vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 429 } as ReturnType<
                typeof fetch
            > extends Promise<infer T>
                ? T
                : never);

            const response = await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            expect(response.status).toBe(429);
            expect(Logger.warn).toHaveBeenCalledWith('Jupiter price API rate limit exceeded', { sentry: true });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });

        it('returns 502 and calls Logger.error on non-rate-limit HTTP error', async () => {
            vi.resetModules();
            const { GET } = await import('../route');
            vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as ReturnType<
                typeof fetch
            > extends Promise<infer T>
                ? T
                : never);

            const response = await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            expect(response.status).toBe(502);
            expect(Logger.error).toHaveBeenCalledWith(new Error('Jupiter price API error: 503'), { sentry: true });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });
    });

    describe('schema mismatch', () => {
        it('returns { price: null } with no-store headers when response schema is unexpected', async () => {
            vi.resetModules();
            const { GET } = await import('../route');
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => ({ [VALID_MINT]: { usdPrice: -1 } }),
                ok: true,
            } as ReturnType<typeof fetch> extends Promise<infer T> ? T : never);

            const response = await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toEqual({ price: null });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });

        it('logs and captures the error on schema mismatch', async () => {
            vi.resetModules();
            const { GET } = await import('../route');
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => ({ [VALID_MINT]: { usdPrice: 0 } }),
                ok: true,
            } as ReturnType<typeof fetch> extends Promise<infer T> ? T : never);

            await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            const expectedErr = new Error(`Jupiter price API returned unexpected schema for ${VALID_MINT}`);
            expect(Logger.error).toHaveBeenCalledWith(expectedErr, { sentry: true });
        });
    });

    describe('successful response', () => {
        it('returns the price with cache headers', async () => {
            vi.resetModules();
            const { GET } = await import('../route');
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => ({ [VALID_MINT]: { usdPrice: 180.5 } }),
                ok: true,
            } as ReturnType<typeof fetch> extends Promise<infer T> ? T : never);

            const response = await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toEqual({ price: 180.5 });
            expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
        });

        it('calls the Jupiter price endpoint with the correct URL', async () => {
            vi.resetModules();
            const { GET } = await import('../route');
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => ({ [VALID_MINT]: { usdPrice: 180.5 } }),
                ok: true,
            } as ReturnType<typeof fetch> extends Promise<infer T> ? T : never);

            await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            expect(fetch).toHaveBeenCalledWith(`${JUPITER_PRICE_ENDPOINT}?ids=${VALID_MINT}`, expect.any(Object));
        });
    });

    describe('fetch exception', () => {
        it('returns 500 and calls Logger.panic on unexpected error', async () => {
            vi.resetModules();
            const { GET } = await import('../route');
            const error = new Error('Network failure');
            vi.mocked(fetch).mockRejectedValueOnce(error);

            const response = await GET(mockRequest, { params: { mintAddress: VALID_MINT } });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toEqual({ error: 'Failed to fetch price data' });
            expect(Logger.panic).toHaveBeenCalledWith(new Error('Jupiter price API error', { cause: error }));
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });
    });
});
