import { fetchSnsDomains } from '@entities/domain/api/fetch-sns-domains';
import Logger from '@utils/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

vi.mock('@entities/domain/api/fetch-sns-domains', () => ({
    fetchSnsDomains: vi.fn(),
}));

vi.mock('@utils/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

const VALID_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const mockRequest = new Request('http://localhost:3000/api/sns-domains/' + VALID_ADDRESS);

describe('GET /api/sns-domains/[address]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validation', () => {
        it('should reject an invalid wallet address', async () => {
            const response = await GET(mockRequest, { params: { address: 'not-a-pubkey' } });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Invalid wallet address');
        });
    });

    describe('successful requests', () => {
        const mockDomains = [
            { address: 'addr1', name: 'alice.sol' },
            { address: 'addr2', name: 'bob.sol' },
        ];

        it('should return domains from fetchSnsDomains', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce(mockDomains);

            const response = await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.domains).toEqual(mockDomains);
        });

        it('should call fetchSnsDomains with the address', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce([]);

            await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(fetchSnsDomains).toHaveBeenCalledWith(VALID_ADDRESS);
        });

        it('should return cache headers with 43200s max-age', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce([]);

            const response = await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=43200, stale-while-revalidate=3600');
        });
    });

    describe('missing address in Bonfida response', () => {
        it('should return 404 with empty domains without caching when address is not found', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce(undefined);

            const response = await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.domains).toEqual([]);
            expect(response.headers.get('Cache-Control')).toBe('no-store');
        });

        it('should log info when address is not found in Bonfida response', async () => {
            vi.mocked(fetchSnsDomains).mockResolvedValueOnce(undefined);

            await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(Logger.info).toHaveBeenCalledWith(
                `Bonfida response does not contain address: ${VALID_ADDRESS}`
            );
        });
    });

    describe('error handling', () => {
        it('should return empty domains array on fetch error', async () => {
            const error = new Error('Bonfida API down');
            vi.mocked(fetchSnsDomains).mockRejectedValueOnce(error);

            const response = await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.domains).toEqual([]);
        });

        it('should log the error on fetch failure', async () => {
            const error = new Error('Bonfida API down');
            vi.mocked(fetchSnsDomains).mockRejectedValueOnce(error);

            await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(Logger.error).toHaveBeenCalledWith(error, `Failed to fetch SNS domains for ${VALID_ADDRESS}`);
        });

        it('should not cache error responses', async () => {
            vi.mocked(fetchSnsDomains).mockRejectedValueOnce(new Error('fail'));

            const response = await GET(mockRequest, { params: { address: VALID_ADDRESS } });

            expect(response.headers.get('Cache-Control')).toBe('no-store');
        });
    });
});
