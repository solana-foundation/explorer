import { resolveDomain } from '@entities/domain/api/resolve-domain';
import Logger from '@utils/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

vi.mock('@entities/domain/api/resolve-domain', () => ({
    resolveDomain: vi.fn(),
}));

vi.mock('@utils/logger', () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

const mockRequest = new Request('http://localhost:3000/api/domain-info/test.sol');

describe('GET /api/domain-info/[domain]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call resolveDomain with the domain param', async () => {
        vi.mocked(resolveDomain).mockResolvedValueOnce(null);

        await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(resolveDomain).toHaveBeenCalledWith('test.sol');
    });

    it('should return resolved domain info as JSON', async () => {
        const mockResult = { address: 'abc123', owner: 'owner456' };
        vi.mocked(resolveDomain).mockResolvedValueOnce(mockResult);

        const response = await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(mockResult);
    });

    it('should return null when domain is not found', async () => {
        vi.mocked(resolveDomain).mockResolvedValueOnce(null);

        const response = await GET(mockRequest, { params: { domain: 'unknown.sol' } });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeNull();
    });

    it('should return cache headers with 86400s max-age', async () => {
        vi.mocked(resolveDomain).mockResolvedValueOnce(null);

        const response = await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600');
    });

    it('should return 500 on unexpected error', async () => {
        vi.mocked(resolveDomain).mockRejectedValueOnce(new Error('Unexpected failure'));

        const response = await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toBeNull();
    });

    it('should set no-cache headers on error responses', async () => {
        vi.mocked(resolveDomain).mockRejectedValueOnce(new Error('fail'));

        const response = await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('should log the error on unexpected failure', async () => {
        const error = new Error('Unexpected failure');
        vi.mocked(resolveDomain).mockRejectedValueOnce(error);

        await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(Logger.error).toHaveBeenCalledWith(error, 'Failed to resolve domain: test.sol');
    });

    describe('invalid domain input', () => {
        it('should return 400 for input without a dot', async () => {
            const response = await GET(mockRequest, { params: { domain: 'notadomain' } });

            expect(response.status).toBe(400);
            expect(await response.json()).toBeNull();
        });

        it('should return 400 for input with spaces', async () => {
            const response = await GET(mockRequest, { params: { domain: 'has spaces.sol' } });

            expect(response.status).toBe(400);
        });

        it('should return 400 for the URL-encoded failing input from the error log', async () => {
            const response = await GET(mockRequest, {
                params: {
                    domain: 'You%20sent%2075.00%20USDC%20via%20Solana%20network%20To%3A%20BPTAmSr68QhspEN2i8KBKDFjDWbtfAhjiAqU6Cd8H2Yi',
                },
            });

            expect(response.status).toBe(400);
        });

        it('should return 400 for empty string', async () => {
            const response = await GET(mockRequest, { params: { domain: '' } });

            expect(response.status).toBe(400);
        });

        it('should set no-cache headers on 400 responses', async () => {
            const response = await GET(mockRequest, { params: { domain: 'invalid' } });

            expect(response.headers.get('Cache-Control')).toBe('no-store');
        });

        it('should not call resolveDomain for invalid input', async () => {
            await GET(mockRequest, { params: { domain: 'garbage input' } });

            expect(resolveDomain).not.toHaveBeenCalled();
        });

        it('should log a warning for invalid input', async () => {
            await GET(mockRequest, { params: { domain: 'notadomain' } });

            expect(Logger.warn).toHaveBeenCalledWith(new Error('Invalid domain input rejected: notadomain'));
        });
    });
});
