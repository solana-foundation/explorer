import { beforeEach, describe, expect, it, vi } from 'vitest';

import Logger from '@/app/utils/logger';

import { fetchProgramsPage } from '../api';
import { getProgramName } from '../model';
import { ProgramMetadata, VerifiedProgramsResponse } from '../types';

// Mock Logger
vi.mock('@/app/utils/logger', () => ({
    default: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock getProgramName
vi.mock('../model', () => ({
    getProgramName: vi.fn((programId: string, repoUrl?: string) => {
        if (repoUrl) {
            // Simple mock implementation
            const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)/);
            if (match) {
                return match[1]
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        }
        return programId;
    }),
}));

global.fetch = vi.fn();

describe('fetchProgramsPage', () => {
    const mockProgramIds = [
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
        'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
    ];

    const mockListResponse: VerifiedProgramsResponse = {
        meta: {
            has_next_page: true,
            has_prev_page: false,
            items_per_page: 10,
            page: 1,
            total: 150,
            total_pages: 15,
        },
        verified_programs: mockProgramIds,
    };

    const mockMetadata: Record<string, ProgramMetadata[]> = {
        [mockProgramIds[0]]: [
            {
                commit: 'abc123',
                executable_hash: 'exec1',
                is_verified: true,
                last_verified_at: '2024-11-20T18:11:17.727030',
                on_chain_hash: 'hash1',
                repo_url: 'https://github.com/solana-labs/solana-program-library',
                signer: 'signer1',
            },
        ],
        [mockProgramIds[1]]: [
            {
                commit: 'def456',
                executable_hash: 'exec2',
                is_verified: true,
                last_verified_at: '2024-11-19T10:00:00.000000',
                on_chain_hash: 'hash2',
                repo_url: 'https://github.com/solana-labs/token-2022',
                signer: 'signer2',
            },
        ],
        [mockProgramIds[2]]: [
            {
                commit: 'ghi789',
                executable_hash: 'exec3',
                is_verified: true,
                last_verified_at: '2024-11-18T15:30:00.000000',
                on_chain_hash: 'hash3',
                repo_url: 'https://github.com/Ellipsis-Labs/phoenix-v1',
                signer: 'signer3',
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('successful requests', () => {
        it('fetches programs page with all metadata', async () => {
            // Mock list API response
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            // Mock metadata API responses
            for (const programId of mockProgramIds) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => mockMetadata[programId],
                    ok: true,
                } as Response);
            }

            const result = await fetchProgramsPage(1);

            expect(result.programs).toHaveLength(3);
            expect(result.totalPages).toBe(15);
            expect(result.totalCount).toBe(150);
            expect(result.currentPage).toBe(1);
        });

        it('calls list API with correct page number', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            // Mock metadata responses
            for (const programId of mockProgramIds) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => mockMetadata[programId],
                    ok: true,
                } as Response);
            }

            await fetchProgramsPage(2);

            expect(fetch).toHaveBeenCalledWith('/api/verified-programs/list/2');
        });

        it('fetches metadata for all programs', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            for (const programId of mockProgramIds) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => mockMetadata[programId],
                    ok: true,
                } as Response);
            }

            await fetchProgramsPage(1);

            // First call is list, next 3 are metadata
            expect(fetch).toHaveBeenCalledTimes(4);
            expect(fetch).toHaveBeenCalledWith(`/api/verified-programs/metadata/${mockProgramIds[0]}`);
            expect(fetch).toHaveBeenCalledWith(`/api/verified-programs/metadata/${mockProgramIds[1]}`);
            expect(fetch).toHaveBeenCalledWith(`/api/verified-programs/metadata/${mockProgramIds[2]}`);
        });

        it('enriches programs with metadata', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            for (const programId of mockProgramIds) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => mockMetadata[programId],
                    ok: true,
                } as Response);
            }

            const result = await fetchProgramsPage(1);

            expect(result.programs[0]).toEqual({
                isVerified: true,
                lastVerifiedAt: '2024-11-20T18:11:17.727030',
                name: 'Solana Program Library',
                programId: mockProgramIds[0],
                repoUrl: 'https://github.com/solana-labs/solana-program-library',
            });

            expect(result.programs[1]).toEqual({
                isVerified: true,
                lastVerifiedAt: '2024-11-19T10:00:00.000000',
                name: 'Token 2022',
                programId: mockProgramIds[1],
                repoUrl: 'https://github.com/solana-labs/token-2022',
            });

            expect(result.programs[2]).toEqual({
                isVerified: true,
                lastVerifiedAt: '2024-11-18T15:30:00.000000',
                name: 'Phoenix V1',
                programId: mockProgramIds[2],
                repoUrl: 'https://github.com/Ellipsis-Labs/phoenix-v1',
            });
        });

        it('calls getProgramName with program ID and repo URL', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            for (const programId of mockProgramIds) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => mockMetadata[programId],
                    ok: true,
                } as Response);
            }

            await fetchProgramsPage(1);

            expect(getProgramName).toHaveBeenCalledWith(
                mockProgramIds[0],
                'https://github.com/solana-labs/solana-program-library'
            );
            expect(getProgramName).toHaveBeenCalledWith(mockProgramIds[1], 'https://github.com/solana-labs/token-2022');
            expect(getProgramName).toHaveBeenCalledWith(
                mockProgramIds[2],
                'https://github.com/Ellipsis-Labs/phoenix-v1'
            );
        });
    });

    describe('partial metadata', () => {
        it('handles programs with missing metadata', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            // First program has metadata
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata[mockProgramIds[0]],
                ok: true,
            } as Response);

            // Second program has no metadata (404)
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            // Third program has metadata
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata[mockProgramIds[2]],
                ok: true,
            } as Response);

            const result = await fetchProgramsPage(1);

            expect(result.programs).toHaveLength(3);

            // First program has metadata
            expect(result.programs[0].repoUrl).toBe('https://github.com/solana-labs/solana-program-library');
            expect(result.programs[0].lastVerifiedAt).toBe('2024-11-20T18:11:17.727030');

            // Second program has no metadata
            expect(result.programs[1].repoUrl).toBeUndefined();
            expect(result.programs[1].lastVerifiedAt).toBeUndefined();
            expect(result.programs[1].name).toBe(mockProgramIds[1]); // Falls back to program ID

            // Third program has metadata
            expect(result.programs[2].repoUrl).toBe('https://github.com/Ellipsis-Labs/phoenix-v1');
            expect(result.programs[2].lastVerifiedAt).toBe('2024-11-18T15:30:00.000000');
        });

        it('handles empty metadata array', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            // All programs return empty arrays
            for (let i = 0; i < mockProgramIds.length; i++) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => [], // Empty array
                    ok: true,
                } as Response);
            }

            const result = await fetchProgramsPage(1);

            expect(result.programs).toHaveLength(3);

            // All programs should have no metadata
            result.programs.forEach((program, index) => {
                expect(program.repoUrl).toBeUndefined();
                expect(program.lastVerifiedAt).toBeUndefined();
                expect(program.name).toBe(mockProgramIds[index]);
                expect(program.isVerified).toBe(true);
            });
        });

        it('handles metadata fetch errors gracefully', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            // First program succeeds
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata[mockProgramIds[0]],
                ok: true,
            } as Response);

            // Second program throws network error
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            // Third program succeeds
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata[mockProgramIds[2]],
                ok: true,
            } as Response);

            const result = await fetchProgramsPage(1);

            expect(result.programs).toHaveLength(3);
            expect(result.programs[0].repoUrl).toBe('https://github.com/solana-labs/solana-program-library');
            expect(result.programs[1].repoUrl).toBeUndefined(); // Error case
            expect(result.programs[2].repoUrl).toBe('https://github.com/Ellipsis-Labs/phoenix-v1');
        });
    });

    describe('error handling', () => {
        it('throws error when list API fails', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
            } as Response);

            await expect(fetchProgramsPage(1)).rejects.toThrow('Failed to fetch verified programs page 1');
        });

        it('logs error when list API fails', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
            } as Response);

            try {
                await fetchProgramsPage(1);
            } catch (error) {
                // Expected to throw
            }

            expect(Logger.error).toHaveBeenCalledWith('Failed to fetch programs page 1', expect.any(Error));
        });

        it('throws error on network failure', async () => {
            const networkError = new Error('Network error');
            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            await expect(fetchProgramsPage(1)).rejects.toThrow('Network error');
        });

        it('logs error on network failure', async () => {
            const networkError = new Error('Network error');
            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            try {
                await fetchProgramsPage(1);
            } catch (error) {
                // Expected to throw
            }

            expect(Logger.error).toHaveBeenCalledWith('Failed to fetch programs page 1', networkError);
        });

        it('logs debug message for failed metadata fetch', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            // Metadata fetch returns 404
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            await fetchProgramsPage(1);

            expect(Logger.debug).toHaveBeenCalledWith(`Metadata fetch failed for ${mockProgramIds[0]}: HTTP 404`);
        });

        it('logs debug message for empty metadata', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            // All metadata requests return empty arrays
            for (let i = 0; i < mockProgramIds.length; i++) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => [],
                    ok: true,
                } as Response);
            }

            await fetchProgramsPage(1);

            expect(Logger.debug).toHaveBeenCalledWith(
                `Metadata is empty for ${mockProgramIds[0]}: API returned empty array`
            );
        });

        it('logs error for metadata fetch exception', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            const fetchError = new Error('Fetch failed');
            vi.mocked(fetch).mockRejectedValueOnce(fetchError);

            // Other metadata fetches succeed
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata[mockProgramIds[1]],
                ok: true,
            } as Response);

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockMetadata[mockProgramIds[2]],
                ok: true,
            } as Response);

            await fetchProgramsPage(1);

            expect(Logger.error).toHaveBeenCalledWith(`Failed to fetch metadata for ${mockProgramIds[0]}`, fetchError);
        });
    });

    describe('pagination', () => {
        it('returns correct pagination info for first page', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => mockListResponse,
                ok: true,
            } as Response);

            for (const programId of mockProgramIds) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => mockMetadata[programId],
                    ok: true,
                } as Response);
            }

            const result = await fetchProgramsPage(1);

            expect(result.currentPage).toBe(1);
            expect(result.totalPages).toBe(15);
            expect(result.totalCount).toBe(150);
        });

        it('returns correct pagination info for middle page', async () => {
            const middlePageResponse = {
                ...mockListResponse,
                meta: {
                    ...mockListResponse.meta,
                    has_next_page: true,
                    has_prev_page: true,
                    page: 5,
                },
            };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => middlePageResponse,
                ok: true,
            } as Response);

            for (const programId of mockProgramIds) {
                vi.mocked(fetch).mockResolvedValueOnce({
                    json: async () => mockMetadata[programId],
                    ok: true,
                } as Response);
            }

            const result = await fetchProgramsPage(5);

            expect(result.currentPage).toBe(5);
            expect(result.totalPages).toBe(15);
            expect(result.totalCount).toBe(150);
        });

        it('handles empty page response', async () => {
            const emptyPageResponse = {
                ...mockListResponse,
                verified_programs: [],
            };

            vi.mocked(fetch).mockResolvedValueOnce({
                json: async () => emptyPageResponse,
                ok: true,
            } as Response);

            const result = await fetchProgramsPage(999);

            expect(result.programs).toHaveLength(0);
            expect(result.totalPages).toBe(15);
            expect(result.totalCount).toBe(150);
        });
    });
});
