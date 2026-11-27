import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { botIdMiddleware } from '@/config/botid-middleware.mjs';

import { proxy } from '../../proxy';

vi.mock('@/config/botid-middleware.mjs', () => ({
    botIdMiddleware: vi.fn(),
}));

function createRequest(pathname: string): NextRequest {
    return new NextRequest(new URL(pathname, 'http://localhost'));
}

describe('Next.js proxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should pass through with 200 when middleware returns undefined', async () => {
        vi.mocked(botIdMiddleware).mockResolvedValue(undefined);

        const response = await proxy(createRequest('/api/test'));

        expect(response.status).toBe(200);
        expect(botIdMiddleware).toHaveBeenCalledTimes(1);
    });

    it('should return the middleware response verbatim when it short-circuits', async () => {
        const blocked = NextResponse.json({ error: 'blocked' }, { status: 401 });
        vi.mocked(botIdMiddleware).mockResolvedValue(blocked);

        const response = await proxy(createRequest('/api/test'));

        expect(response).toBe(blocked);
        expect(response.status).toBe(401);
    });

    describe('public cluster custom URL', () => {
        const DEVNET = encodeURIComponent('https://api.devnet.solana.com');
        const MAINNET_BETA = encodeURIComponent('https://api.mainnet-beta.solana.com');

        it.each([
            [`/tx/abc?cluster=custom&customUrl=${DEVNET}&view=raw`, 'http://localhost/tx/abc?cluster=devnet&view=raw'],
            [`/tx/abc?customUrl=${DEVNET}&cluster=custom`, 'http://localhost/tx/abc?cluster=devnet'],
            [`/tx/abc?cluster=custom&customUrl=${MAINNET_BETA}&view=raw`, 'http://localhost/tx/abc?view=raw'],
        ])('should redirect %s to %s with 308', async (path, location) => {
            const response = await proxy(createRequest(path));

            expect(response.status).toBe(308);
            expect(response.headers.get('Location')).toBe(location);
        });

        it.each([
            `/tx/abc?cluster=devnet&customUrl=${DEVNET}`,
            `/tx/abc?cluster=custom&customUrl=${encodeURIComponent('http://localhost:8899')}`,
        ])('should pass %s through untouched', async path => {
            const response = await proxy(createRequest(path));

            expect(response.status).toBe(200);
            expect(response.headers.get('Location')).toBeNull();
            expect(botIdMiddleware).not.toHaveBeenCalled();
        });
    });

    describe('sitemap gating', () => {
        afterEach(() => {
            vi.unstubAllEnvs();
        });

        it.each(['/sitemap.xml', '/default-sitemap.xml', '/accounts-sitemap.xml'])(
            'should return 404 for %s when SEO_DISALLOW_BOTS is true',
            async pathname => {
                vi.stubEnv('SEO_DISALLOW_BOTS', 'true');

                const response = await proxy(createRequest(pathname));

                expect(response.status).toBe(404);
                expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
                expect(botIdMiddleware).not.toHaveBeenCalled();
            },
        );

        it('should return 200 for a sitemap when SEO_DISALLOW_BOTS is not set', async () => {
            const response = await proxy(createRequest('/sitemap.xml'));

            expect(response.status).toBe(200);
            expect(botIdMiddleware).not.toHaveBeenCalled();
        });
    });
});
