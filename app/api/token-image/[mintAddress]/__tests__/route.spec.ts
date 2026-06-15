import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

vi.mock('@/app/entities/digital-asset/server', () => ({
    getAssetBatch: vi.fn(),
}));

const VALID_MINT = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const BASE_URL = `http://localhost:3000/api/token-image/${VALID_MINT}`;

function makeRequest(url = BASE_URL) {
    return new Request(url);
}

function makeParams(mintAddress = VALID_MINT) {
    return { params: Promise.resolve({ mintAddress }) };
}

describe('GET /api/token-image/[mintAddress]', () => {
    let getAssetBatch: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('@/app/entities/digital-asset/server');
        getAssetBatch = vi.mocked(mod.getAssetBatch);
    });

    describe('validation', () => {
        it('should return 400 for an invalid mint address', async () => {
            const response = await GET(makeRequest(), makeParams('not-a-pubkey'));

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid mint address');
        });

        it('should return 400 for an invalid cluster slug', async () => {
            const response = await GET(makeRequest(`${BASE_URL}?cluster=unknown-cluster`), makeParams());

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid cluster');
        });

        it('should not cache invalid mint address 400 errors', async () => {
            const response = await GET(makeRequest(), makeParams('not-a-pubkey'));

            expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
        });

        it('should not cache invalid cluster 400 errors', async () => {
            const response = await GET(makeRequest(`${BASE_URL}?cluster=unknown-cluster`), makeParams());

            expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
        });
    });

    describe('successful requests', () => {
        it('should return the image URL when the asset has one', async () => {
            getAssetBatch.mockResolvedValueOnce([
                { id: VALID_MINT, content: { links: { image: 'https://example.com/image.png' } } },
            ]);

            const response = await GET(makeRequest(), makeParams());

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.image).toBe('https://example.com/image.png');
        });

        it('should return undefined image when asset has no image link', async () => {
            getAssetBatch.mockResolvedValueOnce([{ id: VALID_MINT, content: { links: {} } }]);

            const response = await GET(makeRequest(), makeParams());

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.image).toBeUndefined();
        });

        it('should return no-store headers when no assets are returned', async () => {
            getAssetBatch.mockResolvedValueOnce(null);

            const response = await GET(makeRequest(), makeParams());

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
        });

        it('should return cache headers on a successful image response', async () => {
            getAssetBatch.mockResolvedValueOnce([
                { id: VALID_MINT, content: { links: { image: 'https://example.com/image.png' } } },
            ]);

            const response = await GET(makeRequest(), makeParams());

            expect(response.headers.get('Cache-Control')).toBe(
                'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600',
            );
        });

        it('should call getAssetBatch with the mint address', async () => {
            getAssetBatch.mockResolvedValueOnce([{ id: VALID_MINT, content: { links: {} } }]);

            await GET(makeRequest(), makeParams());

            expect(getAssetBatch).toHaveBeenCalledWith([VALID_MINT], expect.any(String));
        });
    });
});
