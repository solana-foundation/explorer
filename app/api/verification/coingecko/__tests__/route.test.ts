import fetch from 'node-fetch';
import { vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../[address]/route';

const VALID_ADDRESS = 'B61SyRxF2b8JwSLZHgEUF6rtn6NUikkrK1EMEgP6nhXW';

vi.mock('node-fetch', async () => {
    const actual = await vi.importActual('node-fetch');
    return {
        ...actual,
        default: vi.fn(),
    };
});

const fetchMock = vi.mocked(fetch);

describe('CoinGecko API Route', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.clearAllMocks();
    });

    it('should return 400 for an invalid address', async () => {
        const response = await callRoute('not-a-valid-key');
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid address' });
    });

    it('should return only the fields the client needs', async () => {
        mockFetchResponse(200, {
            categories: ['Stablecoins'],
            id: 'xsgd',
            last_updated: '2025-01-01T00:00:00Z',
            market_cap_rank: 5,
            market_data: {
                current_price: { eur: 0.92, usd: 1.23 },
                market_cap: { eur: 900_000, usd: 1_000_000 },
                price_change_percentage_24h_in_currency: { eur: 0.5, usd: 0.67 },
                total_volume: { eur: 400_000, usd: 500_000 },
            },
        });
        const response = await callRoute(VALID_ADDRESS);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            last_updated: '2025-01-01T00:00:00Z',
            market_cap_rank: 5,
            market_data: {
                current_price: { usd: 1.23 },
                market_cap: { usd: 1_000_000 },
                price_change_percentage_24h_in_currency: { usd: 0.67 },
                total_volume: { usd: 500_000 },
            },
        });
    });

    it('should return 404 when coin is not found', async () => {
        mockFetchResponse(404);
        const response = await callRoute(VALID_ADDRESS);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Failed to fetch coingecko data' });
        expect(Logger.debug).toHaveBeenCalledWith('[api:coingecko] Coin not found by contract address', {
            address: VALID_ADDRESS,
        });
    });

    it('should return 429 and log to sentry when rate limited', async () => {
        mockFetchResponse(429);
        const response = await callRoute(VALID_ADDRESS);
        expect(response.status).toBe(429);
        expect(await response.json()).toEqual({ error: 'Failed to fetch coingecko data' });
        expect(Logger.warn).toHaveBeenCalledWith('[api:coingecko] Rate limit exceeded', { sentry: true });
    });

    it('should return upstream status and log panic for other error codes', async () => {
        mockFetchResponse(503);
        const response = await callRoute(VALID_ADDRESS);
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'Failed to fetch coingecko data' });
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should return 502 and log to sentry when response schema is invalid', async () => {
        mockFetchResponse(200, { unexpected: 'shape' });
        const response = await callRoute(VALID_ADDRESS);
        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Invalid response from coingecko API' });
        expect(Logger.warn).toHaveBeenCalledWith('[api:coingecko] Invalid response schema', {
            address: VALID_ADDRESS,
            sentry: true,
        });
    });

    it('should return 500 when fetch throws', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));
        const response = await callRoute(VALID_ADDRESS);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Failed to fetch coingecko data' });
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should use public API when COINGECKO_API_KEY is not set', async () => {
        delete process.env.COINGECKO_API_KEY;
        mockFetchResponse(200, { market_data: {} });
        await callRoute(VALID_ADDRESS);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('https://api.coingecko.com/api/v3/coins/solana/contract/');
        expect((options?.headers as Record<string, string>)?.['x-cg-pro-api-key']).toBeUndefined();
    });

    it('should use pro API and send key when COINGECKO_API_KEY is set', async () => {
        vi.stubEnv('COINGECKO_API_KEY', 'test-key');
        mockFetchResponse(200, { market_data: {} });
        await callRoute(VALID_ADDRESS);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('https://pro-api.coingecko.com/api/v3/coins/solana/contract/');
        expect((options?.headers as Record<string, string>)?.['x-cg-pro-api-key']).toBe('test-key');
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

function callRoute(address: string) {
    const request = new Request(`http://localhost:3000/api/verification/coingecko/${address}`);
    return GET(request, { params: { address } });
}
