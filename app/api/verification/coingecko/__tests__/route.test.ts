import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../[address]/route';

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn(), panic: vi.fn(), warn: vi.fn() },
}));

const VALID_ADDRESS = 'B61SyRxF2b8JwSLZHgEUF6rtn6NUikkrK1EMEgP6nhXW';
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function mockFetch(status: number, body: Record<string, unknown> = {}) {
    fetchMock.mockResolvedValueOnce({ json: async () => body, ok: status >= 200 && status < 300, status } as Response);
}
function callRoute(address: string) {
    return GET(new Request(`http://localhost/api/verification/coingecko/${address}`), {
        params: Promise.resolve({ address }),
    });
}

describe('CoinGecko verification route (gt_verified)', () => {
    beforeEach(() => vi.stubEnv('COINGECKO_API_KEY', 'test-key'));
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.clearAllMocks();
    });

    it('should return 400 for an invalid address', async () => {
        expect((await callRoute('nope')).status).toBe(400);
    });

    it('should call the keyless GeckoTerminal endpoint when COINGECKO_API_KEY is unset', async () => {
        vi.stubEnv('COINGECKO_API_KEY', '');
        mockFetch(200, { data: { attributes: { gt_verified: true } } });
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(200);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${VALID_ADDRESS}/info`);
        expect((options?.headers as Record<string, string>)?.['x-cg-pro-api-key']).toBeUndefined();
        expect(await r.json()).toEqual({ verified: true });
    });

    it('should call the pro onchain /info endpoint with x-cg-pro-api-key', async () => {
        mockFetch(200, { data: { attributes: { gt_verified: true } } });
        await callRoute(VALID_ADDRESS);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe(`https://pro-api.coingecko.com/api/v3/onchain/networks/solana/tokens/${VALID_ADDRESS}/info`);
        expect((options?.headers as Record<string, string>)['x-cg-pro-api-key']).toBe('test-key');
    });

    it('should return verified:true when gt_verified is true', async () => {
        mockFetch(200, { data: { attributes: { gt_verified: true } } });
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ verified: true });
    });

    it('should return verified:false when gt_verified is false', async () => {
        mockFetch(200, { data: { attributes: { gt_verified: false } } });
        expect(await (await callRoute(VALID_ADDRESS)).json()).toEqual({ verified: false });
    });

    it('should return verified:false when gt_verified is absent', async () => {
        mockFetch(200, { data: { attributes: {} } });
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ verified: false });
    });

    it('should return verified:false when gt_verified is null without a 502', async () => {
        mockFetch(200, { data: { attributes: { gt_verified: null } } });
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ verified: false });
    });

    it('should pass through coingecko_coin_id as coinGeckoId', async () => {
        mockFetch(200, { data: { attributes: { coingecko_coin_id: 'usd-coin', gt_verified: true } } });
        expect(await (await callRoute(VALID_ADDRESS)).json()).toEqual({ coinGeckoId: 'usd-coin', verified: true });
    });

    it('should omit coinGeckoId when coingecko_coin_id is null', async () => {
        mockFetch(200, { data: { attributes: { coingecko_coin_id: null, gt_verified: true } } });
        expect(await (await callRoute(VALID_ADDRESS)).json()).toEqual({ verified: true });
    });

    it('should pass through a 404', async () => {
        mockFetch(404);
        expect((await callRoute(VALID_ADDRESS)).status).toBe(404);
    });

    it('should return 429 and log to sentry when rate limited', async () => {
        mockFetch(429);
        const r = await callRoute(VALID_ADDRESS);
        expect(r.status).toBe(429);
        expect(Logger.warn).toHaveBeenCalledWith('[api:coingecko] Rate limit exceeded', { sentry: true });
    });

    it('should return 502 on a schema mismatch', async () => {
        mockFetch(200, { unexpected: 'shape' });
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
        expect(Logger.warn).toHaveBeenCalledWith('[api:coingecko] Failed to parse upstream JSON', {
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
});
