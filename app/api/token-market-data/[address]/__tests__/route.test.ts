import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createCoinGeckoMarketData,
    createTokenMarketData,
} from '@/app/features/token-market-data/__tests__/__fixtures__/market-data';
import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../route';

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn(), panic: vi.fn(), warn: vi.fn() },
}));

const VALID_ADDRESS = 'B61SyRxF2b8JwSLZHgEUF6rtn6NUikkrK1EMEgP6nhXW';
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function mockFetchResponse(status: number, body: Record<string, unknown> = {}) {
    fetchMock.mockResolvedValueOnce({ json: async () => body, ok: status >= 200 && status < 300, status } as Response);
}
function callRoute(address: string) {
    return GET(new Request(`http://localhost/api/token-market-data/${address}`), {
        params: Promise.resolve({ address }),
    });
}

describe('Token Market Data API Route', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.clearAllMocks();
    });

    it('should return 400 for an invalid address', async () => {
        expect((await callRoute('not-a-key')).status).toBe(400);
    });

    it('should return the normalized shape', async () => {
        mockFetchResponse(200, createCoinGeckoMarketData());
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual(createTokenMarketData());
    });

    it('should emit null marketCapRank for unranked tokens', async () => {
        mockFetchResponse(
            200,
            createCoinGeckoMarketData({
                market_cap_rank: null,
                market_data: { current_price: { usd: 0.01 }, market_cap: { usd: 10_000 }, total_volume: { usd: 500 } },
            }),
        );
        expect((await (await callRoute(VALID_ADDRESS)).json()).marketCapRank).toBeNull();
    });

    it('should omit priceChange24h when upstream lacks it', async () => {
        mockFetchResponse(
            200,
            createCoinGeckoMarketData({
                market_cap_rank: null,
                market_data: { current_price: { usd: 0.01 }, market_cap: { usd: 10_000 }, total_volume: { usd: 500 } },
            }),
        );
        expect((await (await callRoute(VALID_ADDRESS)).json()).priceChange24h).toBeUndefined();
    });

    it('should render price-only when market cap and volume are missing', async () => {
        mockFetchResponse(
            200,
            createCoinGeckoMarketData({ market_cap_rank: null, market_data: { current_price: { usd: 1.23 } } }),
        );
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(200);
        const body = await r.json();
        expect(body.price).toBe(1.23);
        expect(body.marketCap).toBeUndefined();
        expect(body.volume24h).toBeUndefined();
    });

    it('should return 404 with "No market data" when there is no USD price', async () => {
        mockFetchResponse(
            200,
            createCoinGeckoMarketData({
                last_updated: null,
                market_cap_rank: null,
                market_data: { current_price: {}, market_cap: {}, total_volume: {} },
            }),
        );
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(404);
        expect(await r.json()).toEqual({ error: 'No market data' });
        expect(Logger.warn).toHaveBeenCalledWith('[api:token-market-data] No market data', { address: VALID_ADDRESS });
    });

    it('should return 404 when upstream 404s', async () => {
        mockFetchResponse(404);
        expect((await callRoute(VALID_ADDRESS)).status).toBe(404);
    });

    it('should return 429 and log to sentry when rate limited', async () => {
        mockFetchResponse(429);
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(429);
        expect(Logger.warn).toHaveBeenCalledWith('[api:token-market-data] Rate limit exceeded', { sentry: true });
    });

    it('should return 502 and log to sentry on a malformed schema', async () => {
        // Has a USD price (passes the pre-check) but last_updated is the wrong type.
        mockFetchResponse(
            200,
            createCoinGeckoMarketData({
                last_updated: 12345,
                market_cap_rank: null,
                market_data: { current_price: { usd: 1.23 } },
            }),
        );
        expect((await callRoute(VALID_ADDRESS)).status).toBe(502);
    });

    it('should return 502 and log when the upstream body is not valid JSON', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => {
                throw new SyntaxError('Unexpected token < in JSON');
            },
            ok: true,
            status: 200,
        } as unknown as Response);
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(502);
        expect(Logger.warn).toHaveBeenCalledWith('[api:token-market-data] Failed to parse upstream JSON', {
            address: VALID_ADDRESS,
            sentry: true,
        });
    });

    it('should return 504 with ERROR_CACHE_HEADERS on timeout', async () => {
        fetchMock.mockRejectedValueOnce(new DOMException('Signal timed out.', 'TimeoutError'));
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(504);
        expect(r.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=30');
    });

    it('should return 500 when fetch throws', async () => {
        fetchMock.mockRejectedValueOnce(new Error('net'));
        expect((await callRoute(VALID_ADDRESS)).status).toBe(500);
    });

    it('should use the public API when COINGECKO_API_KEY is unset', async () => {
        vi.stubEnv('COINGECKO_API_KEY', '');
        mockFetchResponse(200, createCoinGeckoMarketData({ market_data: {} }));
        await callRoute(VALID_ADDRESS);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('https://api.coingecko.com/api/v3/coins/solana/contract/');
        expect((options?.headers as Record<string, string>)?.['x-cg-pro-api-key']).toBeUndefined();
    });

    it('should use the pro API with the key when COINGECKO_API_KEY is set', async () => {
        vi.stubEnv('COINGECKO_API_KEY', 'test-key');
        mockFetchResponse(200, createCoinGeckoMarketData({ market_data: {} }));
        await callRoute(VALID_ADDRESS);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('https://pro-api.coingecko.com/api/v3/coins/solana/contract/');
        expect((options?.headers as Record<string, string>)?.['x-cg-pro-api-key']).toBe('test-key');
    });
});
