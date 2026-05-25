import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../route';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

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
        it('should reject program IDs that are too short', async () => {
            const params = { params: Promise.resolve({ programId: 'short' }) };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid program ID');
        });

        it('should reject program IDs that are too long', async () => {
            const params = { params: Promise.resolve({ programId: 'a'.repeat(45) }) };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid program ID');
        });

        it('should reject empty program IDs', async () => {
            const params = { params: Promise.resolve({ programId: '' }) };
            const response = await GET(mockRequest, params);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid program ID');
        });

        it('should accept program IDs with length 32', async () => {
            const validProgramId = 'a'.repeat(32);
            const params = { params: Promise.resolve({ programId: validProgramId }) };

            fetchMock.mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            expect(response.status).toBe(200);
        });

        it('should accept program IDs with length 44', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };

            fetchMock.mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);
            expect(response.status).toBe(200);
        });
    });

    describe('successful requests', () => {
        it('should fetch metadata from osec.io', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };

            fetchMock.mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            await GET(mockRequest, params);

            expect(fetchMock).toHaveBeenCalledWith(`https://verify.osec.io/status-all/${mockProgramId}`);
        });

        it('should return metadata with cache headers', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };

            fetchMock.mockResolvedValueOnce({
                json: async () => mockMetadata,
                ok: true,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

            const data = await response.json();
            expect(data).toEqual(mockMetadata);
        });

        it('should return multiple metadata entries', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };
            const multipleMetadata = [mockMetadata[0], { ...mockMetadata[0], verified_at: '2024-10-01' }];

            fetchMock.mockResolvedValueOnce({
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
        it('should return empty array with cache headers on 404', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };

            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

            const data = await response.json();
            expect(data).toEqual([]);
        });

        it('should log debug message on 404', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };

            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            await GET(mockRequest, params);

            expect(Logger.debug).toHaveBeenCalledWith('[api:verified-programs] Failed to fetch metadata', {
                programId: mockProgramId,
                status: 404,
            });
        });

        it('should return error on 500 from osec.io', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };

            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
            } as Response);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Failed to fetch program metadata');
        });

        it('should log debug message on non-404 errors', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };

            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 503,
            } as Response);

            await GET(mockRequest, params);

            expect(Logger.debug).toHaveBeenCalledWith('[api:verified-programs] Failed to fetch metadata', {
                programId: mockProgramId,
                status: 503,
            });
        });

        it('should handle network errors', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };
            const networkError = new Error('Network error');

            fetchMock.mockRejectedValueOnce(networkError);

            const response = await GET(mockRequest, params);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Internal server error');
        });

        it('should log errors to Logger', async () => {
            const params = { params: Promise.resolve({ programId: mockProgramId }) };
            const networkError = new Error('Network error');

            fetchMock.mockRejectedValueOnce(networkError);

            await GET(mockRequest, params);

            expect(Logger.error).toHaveBeenCalledWith(networkError, { programId: mockProgramId });
        });
    });
});
