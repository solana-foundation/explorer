import { resolveDomain } from '@entities/domain/server';
import { address } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../route';

vi.mock('@entities/domain/server', async () => {
    const { Domain } = await vi.importActual<typeof import('@entities/domain/lib/domain-struct')>(
        '@entities/domain/lib/domain-struct',
    );
    return { Domain, resolveDomain: vi.fn() };
});

const mockRequest = new Request('http://localhost:3000/api/domain-info/test.sns');

describe('GET /api/domain-info/[domain]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return resolved domain info as JSON', async () => {
        const mockResult = {
            address: address('FX1APjKbFu6M8GKb3dGXcZLXjxX4fGaYwvHqb5Vaee8q'),
            owner: address('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdRrbukszb'),
        };
        vi.mocked(resolveDomain).mockResolvedValueOnce(mockResult);

        const response = await GET(mockRequest, { params: Promise.resolve({ domain: 'test.sns' }) });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(mockResult);
    });

    it('should return a cached null when domain is not found', async () => {
        vi.mocked(resolveDomain).mockResolvedValueOnce(null);

        const response = await GET(mockRequest, { params: Promise.resolve({ domain: 'unknown.sns' }) });

        expect(resolveDomain).toHaveBeenCalledWith('unknown.sns');
        expect(response.status).toBe(200);
        expect(await response.json()).toBeNull();
        expect(response.headers.get('Cache-Control')).toBe(
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
        );
    });

    it('should escalate and return an uncached 500 on unexpected failure', async () => {
        const error = new Error('Unexpected failure');
        vi.mocked(resolveDomain).mockRejectedValueOnce(error);

        const response = await GET(mockRequest, { params: Promise.resolve({ domain: 'test.sns' }) });

        expect(response.status).toBe(500);
        expect(await response.json()).toBeNull();
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(Logger.panic).toHaveBeenCalledWith(
            expect.objectContaining({
                cause: error,
                message: '[api:domain-info] Failed to resolve domain',
            }),
            { sentryExtras: { domain: 'test.sns' } },
        );
    });

    it.each([
        'notadomain',
        'invalid',
        'garbage input',
        'You sent 75.00 USDC via Solana network To: BPTAmSr68QhspEN2i8KBKDFjDWbtfAhjiAqU6Cd8H2Yi',
    ])('should reject "%s" with an uncached 400 without resolving it', async domain => {
        const response = await GET(mockRequest, { params: Promise.resolve({ domain }) });

        expect(response.status).toBe(400);
        expect(await response.json()).toBeNull();
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(resolveDomain).not.toHaveBeenCalled();
        expect(Logger.warn).toHaveBeenCalledWith(`Invalid domain input rejected: ${domain}`);
    });
});
