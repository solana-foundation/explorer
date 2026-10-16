import { fetchAnsDomains } from '@entities/domain/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../route';

vi.mock('@entities/domain/server', () => ({
    fetchAnsDomains: vi.fn(),
}));

const VALID_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const mockRequest = new Request(`http://localhost:3000/api/ans-domains/${VALID_ADDRESS}`);

describe('GET /api/ans-domains/[address]', () => {
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
            { address: 'addr1', name: 'alice.abc' },
            { address: 'addr2', name: 'bob.abc' },
        ];

        it('should return domains from fetchAnsDomains', async () => {
            vi.mocked(fetchAnsDomains).mockResolvedValueOnce(mockDomains);

            const response = await GET(mockRequest, { params: Promise.resolve({ address: VALID_ADDRESS }) });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.domains).toEqual(mockDomains);
        });

        it('should call fetchAnsDomains with the address and cache the response for 86400s', async () => {
            vi.mocked(fetchAnsDomains).mockResolvedValueOnce([]);

            const response = await GET(mockRequest, { params: Promise.resolve({ address: VALID_ADDRESS }) });

            expect(fetchAnsDomains).toHaveBeenCalledWith(VALID_ADDRESS);
            expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=86400, stale-while-revalidate=3600');
        });
    });

    describe('error handling', () => {
        it('should escalate and return uncached empty domains on fetch error', async () => {
            const error = new Error('Connection failed');
            vi.mocked(fetchAnsDomains).mockRejectedValueOnce(error);

            const response = await GET(mockRequest, { params: Promise.resolve({ address: VALID_ADDRESS }) });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.domains).toEqual([]);
            expect(response.headers.get('Cache-Control')).toBe('no-store');
            expect(Logger.panic).toHaveBeenCalledWith(
                expect.objectContaining({
                    cause: error,
                    message: '[api:ans-domains] Failed to fetch ANS domains',
                }),
                { sentryExtras: { address: VALID_ADDRESS } },
            );
        });
    });
});
