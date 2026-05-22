import { vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

// The route reads JUPITER_API_KEY into a module-level const, so the env must
// be set before the route module is imported. vi.hoisted runs above the
// `import { GET }` below in the transformed output.
vi.hoisted(() => {
    process.env.JUPITER_API_KEY = 'test-key';
});

import { GET } from '../[mintAddress]/route';

const VALID_MINT = 'B61SyRxF2b8JwSLZHgEUF6rtn6NUikkrK1EMEgP6nhXW';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('Jupiter API Route', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 for an invalid mint address', async () => {
        const response = await callRoute('not-a-valid-key');
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid mint address' });
    });

    it('should call the Jupiter search endpoint with the API key header', async () => {
        mockFetchResponse(200, [{ id: VALID_MINT, isVerified: true }]);
        await callRoute(VALID_MINT);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe(`https://api.jup.ag/tokens/v2/search?query=${VALID_MINT}`);
        expect((options?.headers as Record<string, string>)?.['x-api-key']).toBe('test-key');
    });

    it('should return verified: true when the token is verified by Jupiter', async () => {
        mockFetchResponse(200, [{ id: VALID_MINT, isVerified: true }]);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ verified: true });
    });

    it('should return verified: false when the token has isVerified: false', async () => {
        mockFetchResponse(200, [{ id: VALID_MINT, isVerified: false }]);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ verified: false });
    });

    it('should return verified: false when isVerified is missing', async () => {
        mockFetchResponse(200, [{ id: VALID_MINT }]);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ verified: false });
    });

    it('should return verified: false when the mint is not in the response array', async () => {
        mockFetchResponse(200, [{ id: 'OtherMint11111111111111111111111111111111111', isVerified: true }]);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ verified: false });
    });

    it('should return 502 with short cache when the response shape is unexpected', async () => {
        mockFetchResponse(200, { unexpected: 'shape' });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Upstream schema mismatch' });
        expect(Logger.error).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ mintAddress: VALID_MINT, sentry: true }),
        );
    });

    it('should return 404 silently when Jupiter responds with 404', async () => {
        mockFetchResponse(404);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Failed to fetch jupiter data' });
        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 429 and log to sentry when rate limited', async () => {
        mockFetchResponse(429);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(429);
        expect(await response.json()).toEqual({ error: 'Failed to fetch jupiter data' });
        expect(Logger.warn).toHaveBeenCalledWith('[api:jupiter] Rate limit exceeded', { sentry: true });
    });

    it('should return upstream status and log panic for other error codes', async () => {
        mockFetchResponse(503);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'Failed to fetch jupiter data' });
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should return 500 when fetch throws', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Failed to fetch jupiter data' });
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should return 504 with short negative cache when upstream request times out', async () => {
        const timeoutError = new DOMException('Signal timed out.', 'TimeoutError');
        fetchMock.mockRejectedValueOnce(timeoutError);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(504);
        expect(await response.json()).toEqual({ error: 'Upstream request timed out' });
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=30');
        expect(Logger.warn).toHaveBeenCalledWith('[api:jupiter] Upstream request timed out', {
            mintAddress: VALID_MINT,
            sentry: true,
        });
        expect(Logger.panic).not.toHaveBeenCalled();
    });
});

function mockFetchResponse(status: number, body: unknown = []) {
    const ok = status >= 200 && status < 300;
    // Cast: tests only stub the surface of Response that the route touches.
    fetchMock.mockResolvedValueOnce({
        json: async () => body,
        ok,
        status,
    } as Response);
}

function callRoute(mintAddress: string) {
    const request = new Request(`http://localhost:3000/api/verification/jupiter/${mintAddress}`);
    return GET(request, { params: Promise.resolve({ mintAddress }) });
}
