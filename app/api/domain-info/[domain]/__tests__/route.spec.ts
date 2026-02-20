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
    },
}));

const mockRequest = new Request('http://localhost:3000/api/domain-info/test.sol');

describe('GET /api/domain-info/[domain]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls resolveDomain with the domain param', async () => {
        vi.mocked(resolveDomain).mockResolvedValueOnce(null);

        await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(resolveDomain).toHaveBeenCalledWith('test.sol');
    });

    it('returns resolved domain info as JSON', async () => {
        const mockResult = { address: 'abc123', owner: 'owner456' };
        vi.mocked(resolveDomain).mockResolvedValueOnce(mockResult);

        const response = await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(mockResult);
    });

    it('returns null when domain is not found', async () => {
        vi.mocked(resolveDomain).mockResolvedValueOnce(null);

        const response = await GET(mockRequest, { params: { domain: 'unknown.sol' } });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeNull();
    });

    it('returns cache headers with 86400s max-age', async () => {
        vi.mocked(resolveDomain).mockResolvedValueOnce(null);

        const response = await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=86400, stale-while-revalidate=3600');
    });

    it('returns null on unexpected error', async () => {
        vi.mocked(resolveDomain).mockRejectedValueOnce(new Error('Unexpected failure'));

        const response = await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeNull();
    });

    it('logs the error on unexpected failure', async () => {
        const error = new Error('Unexpected failure');
        vi.mocked(resolveDomain).mockRejectedValueOnce(error);

        await GET(mockRequest, { params: { domain: 'test.sol' } });

        expect(Logger.error).toHaveBeenCalledWith(error, 'Failed to resolve domain: test.sol');
    });
});
