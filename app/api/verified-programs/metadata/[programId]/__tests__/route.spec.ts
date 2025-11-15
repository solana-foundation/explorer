import { beforeEach, describe, expect, it, vi } from 'vitest';

import Logger from '@/app/utils/logger';

import { GET } from '../route';

vi.mock('@/app/utils/logger', () => ({
    default: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

global.fetch = vi.fn();

describe('GET /api/verified-programs/metadata/[programId]', () => {
    const mockProgramId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const mockRequest = new Request('http://localhost:3000/api/verified-programs/metadata/test');

    const mockMetadata = [
        {
            executable_hash: 'def456',
            on_chain_hash: 'abc123',
            repo_url: 'https://github.com/solana-labs/solana-program-library',
            verified_at: '2024-11-20T18:11:17.727030',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validation', () => {
        it('rejects program IDs that are too short', async () => {
            const params = { params: { programId: 'short' } };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid program ID');
        });

        it('rejects program IDs that are too long', async () => {
            const params = { params: { programId: 'a'.repeat(45) } };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid program ID');
        });

        it('rejects empty program IDs', async () => {
            const params = { params: { programId: '' } };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid program ID');
        });

        it('accepts program IDs with length 32', async () => {
            const validProgramId = 'a'.repeat(32);
            const params = { params: { programId: validProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            expect(response.status).toBe(200);
        });

        it('accepts program IDs with length 44', async () => {
            const params = { params: { programId: mockProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            expect(response.status).toBe(200);
        });
    });

    describe('successful requests', () => {
        it('fetches metadata from osec.io', async () => {
            const params = { params: { programId: mockProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            await GET(mockRequest, params);

            expect(fetch).toHaveBeenCalledWith(`https://verify.osec.io/status-all/${mockProgramId}`);
        });

        it('returns metadata with cache headers', async () => {
            const params = { params: { programId: mockProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

            const data = await response.json();
            expect(data).toEqual(mockMetadata);
        });

        it('returns multiple metadata entries', async () => {
            const params = { params: { programId: mockProgramId } };
            const multipleMetadata = [mockMetadata[0], { ...mockMetadata[0], verified_at: '2024-10-01' }];

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => multipleMetadata,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            const data = await response.json();

            expect(data).toEqual(multipleMetadata);
            expect(data).toHaveLength(2);
        });
    });

    describe('error handling', () => {
        it('returns empty array with cache headers on 404', async () => {
            const params = { params: { programId: mockProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

            const data = await response.json();
            expect(data).toEqual([]);
        });

        it('logs debug message on 404', async () => {
            const params = { params: { programId: mockProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            await GET(mockRequest, params);

            expect(Logger.debug).toHaveBeenCalledWith(`Failed to fetch metadata for ${mockProgramId}: HTTP 404`);
        });

        it('returns error on 500 from osec.io', async () => {
            const params = { params: { programId: mockProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Failed to fetch program metadata');
        });

        it('logs debug message on non-404 errors', async () => {
            const params = { params: { programId: mockProgramId } };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 503,
            } as Response);

            await GET(mockRequest, params);

            expect(Logger.debug).toHaveBeenCalledWith(`Failed to fetch metadata for ${mockProgramId}: HTTP 503`);
        });

        it('handles network errors', async () => {
            const params = { params: { programId: mockProgramId } };
            const networkError = new Error('Network error');

            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Internal server error');
        });

        it('logs errors to Logger', async () => {
            const params = { params: { programId: mockProgramId } };
            const networkError = new Error('Network error');

            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            await GET(mockRequest, params);

            expect(Logger.error).toHaveBeenCalledWith(`Error fetching metadata for ${mockProgramId}:`, networkError);
        });
    });
});
