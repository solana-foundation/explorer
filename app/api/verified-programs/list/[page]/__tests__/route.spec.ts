import { beforeEach, describe, expect, it, vi } from 'vitest';

import Logger from '@/app/utils/logger';

import { GET } from '../route';

vi.mock('@/app/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}));

global.fetch = vi.fn();

describe('GET /api/verified-programs/list/[page]', () => {
    const mockRequest = new Request('http://localhost:3000/api/verified-programs/list/1');

    const mockProgramList = {
        meta: {
            current_page: 1,
            per_page: 10,
            total: 150,
            total_pages: 15,
        },
        programs: [
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validation', () => {
        it('rejects non-numeric page numbers', async () => {
            const params = { params: { page: 'abc' } };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid page number');
        });

        it('rejects page number zero', async () => {
            const params = { params: { page: '0' } };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid page number');
        });

        it('rejects negative page numbers', async () => {
            const params = { params: { page: '-1' } };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid page number');
        });

        it('rejects decimal page numbers', async () => {
            const params = { params: { page: '1.5' } };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid page number');
        });

        it('accepts page number 1', async () => {
            const params = { params: { page: '1' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockProgramList,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            expect(response.status).toBe(200);
        });

        it('accepts large page numbers', async () => {
            const params = { params: { page: '999' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockProgramList,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            expect(response.status).toBe(200);
        });
    });

    describe('successful requests', () => {
        it('fetches program list from osec.io', async () => {
            const params = { params: { page: '2' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockProgramList,
                ok: true,
            } as Response);

            await GET(mockRequest, params);

            expect(fetch).toHaveBeenCalledWith('https://verify.osec.io/verified-programs/2');
        });

        it('returns program list with cache headers', async () => {
            const params = { params: { page: '1' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockProgramList,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');

            const data = await response.json();
            expect(data).toEqual(mockProgramList);
        });

        it('returns correct pagination metadata', async () => {
            const params = { params: { page: '1' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockProgramList,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            const data = await response.json();

            expect(data.meta.total).toBe(150);
            expect(data.meta.total_pages).toBe(15);
            expect(data.meta.current_page).toBe(1);
            expect(data.meta.per_page).toBe(10);
        });

        it('returns program IDs array', async () => {
            const params = { params: { page: '1' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockProgramList,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            const data = await response.json();

            expect(data.programs).toEqual([
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
            ]);
        });
    });

    describe('error handling', () => {
        it('returns error on 404 from osec.io', async () => {
            const params = { params: { page: '999' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('Failed to fetch verified programs');
        });

        it('returns error on 500 from osec.io', async () => {
            const params = { params: { page: '1' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Failed to fetch verified programs');
        });

        it('logs error message on failed fetch', async () => {
            const params = { params: { page: '1' } };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 503,
            } as Response);

            await GET(mockRequest, params);

            expect(Logger.error).toHaveBeenCalledWith('Failed to fetch verified programs page 1: HTTP 503');
        });

        it('handles network errors', async () => {
            const params = { params: { page: '1' } };
            const networkError = new Error('Network error');

            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Internal server error');
        });

        it('logs network errors to Logger', async () => {
            const params = { params: { page: '1' } };
            const networkError = new Error('Network error');

            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            await GET(mockRequest, params);

            expect(Logger.error).toHaveBeenCalledWith('Error in verified-programs list API:', networkError);
        });
    });
});
