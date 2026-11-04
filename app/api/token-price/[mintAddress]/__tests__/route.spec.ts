import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, JUPITER_PRICE_ENDPOINT, NO_STORE_HEADERS } from '../config';

// The route reads JUPITER_API_KEY once, when the module loads.
vi.hoisted(() => {
    process.env.JUPITER_API_KEY = 'test-api-key';
});

import { GET } from '../route';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const VALID_MINT = 'So11111111111111111111111111111111111111112';
const OTHER_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const mockRequest = new Request(`http://localhost:3000/api/token-price/${VALID_MINT}`);

// Cast: tests only stub the surface of Response that the route touches.
function mockResponseOnce(value: Partial<Response>) {
    fetchMock.mockResolvedValueOnce(value as Response);
}

describe('GET /api/token-price/[mintAddress]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('validation', () => {
        it('should return 400 for an invalid mint address', async () => {
            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: 'not-a-valid-pubkey' }) });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data).toEqual({ error: 'Invalid mint address' });
        });
    });

    describe('missing API key', () => {
        it('should return 500 when JUPITER_API_KEY is not set', async () => {
            vi.stubEnv('JUPITER_API_KEY', '');
            vi.resetModules();
            const { GET } = await import('../route');

            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toEqual({ error: 'Jupiter API is misconfigured' });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });
    });

    describe('Jupiter API errors', () => {
        it('should return 429 and calls Logger.warn on rate limit', async () => {
            mockResponseOnce({ ok: false, status: 429 });

            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

            expect(response.status).toBe(429);
            expect(Logger.warn).toHaveBeenCalledWith('Jupiter price API rate limit exceeded', { sentry: true });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });

        it('should return 502 and calls Logger.error on non-rate-limit HTTP error', async () => {
            mockResponseOnce({ ok: false, status: 503 });

            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

            expect(response.status).toBe(502);
            expect(Logger.error).toHaveBeenCalledWith(new Error('Jupiter price API error: 503'), { sentry: true });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });
    });

    describe('schema mismatch', () => {
        it.each([
            ['a negative usdPrice', { [VALID_MINT]: { usdPrice: -1 } }],
            ['a zero usdPrice', { [VALID_MINT]: { usdPrice: 0 } }],
            ['a null token', { [VALID_MINT]: null }],
            ['a null body', null],
            ['an empty array', []],
            ['the token nested under data', { data: { [VALID_MINT]: { usdPrice: 93.2 } } }],
            ['only another mint', { [OTHER_MINT]: { usdPrice: 1 } }],
        ])('should log the error and return { price: null } with no-store headers for %s', async (_reason, body) => {
            mockResponseOnce({ json: async () => body, ok: true });

            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ price: null });
            expect(Logger.error).toHaveBeenCalledWith(
                new Error(`Jupiter price API returned unexpected schema for ${VALID_MINT}`),
                { sentry: true },
            );
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });
    });

    describe('no price', () => {
        it.each([
            ['a token without usdPrice', { [VALID_MINT]: { blockId: 408752772, decimals: 8, liquidity: 856.71 } }],
            ['an empty object', {}],
        ])(
            'should return { price: null } with cache headers and not log an error or a warning for %s',
            async (_reason, body) => {
                mockResponseOnce({ json: async () => body, ok: true });

                const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

                expect(response.status).toBe(200);
                const data = await response.json();
                expect(data).toEqual({ price: null });
                expect(Logger.error).not.toHaveBeenCalled();
                expect(Logger.warn).not.toHaveBeenCalled();
                expect(Logger.panic).not.toHaveBeenCalled();
                expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
            },
        );
    });

    describe('successful response', () => {
        it('should return the price from the Jupiter price endpoint with cache headers', async () => {
            mockResponseOnce({
                json: async () => ({ [VALID_MINT]: { usdPrice: 180.5 } }),
                ok: true,
            });

            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

            expect(fetchMock).toHaveBeenCalledWith(`${JUPITER_PRICE_ENDPOINT}?ids=${VALID_MINT}`, expect.any(Object));
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toEqual({ price: 180.5 });
            expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
        });

        it('should return the requested mint price and ignore other keys', async () => {
            mockResponseOnce({
                json: async () => ({ [OTHER_MINT]: null, [VALID_MINT]: { usdPrice: 1 } }),
                ok: true,
            });

            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

            expect(await response.json()).toEqual({ price: 1 });
            expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
        });
    });

    describe('fetch exception', () => {
        it('should return 500 and calls Logger.panic on unexpected error', async () => {
            const error = new Error('Network failure');
            fetchMock.mockRejectedValueOnce(error);

            const response = await GET(mockRequest, { params: Promise.resolve({ mintAddress: VALID_MINT }) });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toEqual({ error: 'Failed to fetch price data' });
            expect(Logger.panic).toHaveBeenCalledWith(new Error('Jupiter price API error', { cause: error }));
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE_HEADERS['Cache-Control']);
        });
    });
});
