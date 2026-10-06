import { fetchSnsDomains } from '@entities/domain/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../route';

vi.mock('@entities/domain/server', () => ({
    fetchSnsDomains: vi.fn(),
}));

const VALID_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const mockRequest = new Request(`http://localhost:3000/api/sns-domains/${VALID_ADDRESS}`);

describe('GET /api/sns-domains/[address]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validation', () => {
        it('should reject an invalid wallet address', async () => {
            const response = await GET(mockRequest, { params: Promise.resolve({ address: 'not-a-pubkey' }) });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid wallet address');
        });
    });

    describe('successful requests', () => {
        const mockDomains = [
            { address: 'addr1', name: 'alice.sns' },
            { address: 'addr2', name: 'bob.sns' },
        ];

        it('should return domains from fetchSnsDomains', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce(mockDomains);

            const response = await GET(mockRequest, { params: Promise.resolve({ address: VALID_ADDRESS }) });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.domains).toEqual(mockDomains);
        });

        it('should call fetchSnsDomains with the address and cache the response for 43200s', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce([]);

            const response = await GET(mockRequest, { params: Promise.resolve({ address: VALID_ADDRESS }) });

            expect(fetchSnsDomains).toHaveBeenCalledWith(VALID_ADDRESS);
            expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=43200, stale-while-revalidate=3600');
        });
    });

    describe('not found', () => {
        it('should return 404 when no domains found', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce(undefined);

            const response = await GET(mockRequest, { params: Promise.resolve({ address: VALID_ADDRESS }) });

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.domains).toEqual([]);
            expect(response.headers.get('Cache-Control')).toBe('no-store');
            expect(Logger.info).toHaveBeenCalledWith(`Bonfida API returned 404 for address: ${VALID_ADDRESS}`);
        });
    });

    describe('error handling', () => {
        it('should log and return uncached empty domains with 500 on fetch failure', async () => {
            const error = new Error('Bonfida API down');
            vi.mocked(fetchSnsDomains).mockRejectedValueOnce(error);

            const response = await GET(mockRequest, { params: Promise.resolve({ address: VALID_ADDRESS }) });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.domains).toEqual([]);
            expect(response.headers.get('Cache-Control')).toBe('no-store');
            expect(Logger.error).toHaveBeenCalledWith(error, { address: VALID_ADDRESS });
        });
    });
});
