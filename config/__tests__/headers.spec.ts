import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildHeaders } from '../headers.mjs';

const SEO_CACHE = 'public, max-age=3600, stale-while-revalidate=86400';

function robotsTagEntries() {
    return buildHeaders().filter(entry => entry.headers.some(header => header.key === 'X-Robots-Tag'));
}

describe('next headers', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it.each(['/sitemap.xml', '/default-sitemap.xml', '/accounts-sitemap.xml'])(
        'should cache %s for an hour',
        source => {
            const entry = buildHeaders().find(e => e.source === source);
            expect(entry?.headers).toEqual([{ key: 'Cache-Control', value: SEO_CACHE }]);
        },
    );

    it('should leave robots.txt to the route handler, which owns its own Cache-Control', () => {
        expect(buildHeaders().some(entry => entry.source === '/robots.txt')).toBe(false);
    });

    it('should not send X-Robots-Tag when the flag is not set', () => {
        expect(robotsTagEntries()).toEqual([]);
    });

    it('should not send X-Robots-Tag when the flag is explicitly false', () => {
        vi.stubEnv('SEO_DISALLOW_BOTS', 'false');

        expect(robotsTagEntries()).toEqual([]);
    });

    it('should send X-Robots-Tag on every path when the flag is true', () => {
        vi.stubEnv('SEO_DISALLOW_BOTS', 'true');

        expect(robotsTagEntries()).toEqual([
            { headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }], source: '/:path*' },
        ]);
    });

    it('should keep caching the sitemaps when the flag is true', () => {
        vi.stubEnv('SEO_DISALLOW_BOTS', 'true');

        const entry = buildHeaders().find(e => e.source === '/sitemap.xml');
        expect(entry?.headers).toEqual([{ key: 'Cache-Control', value: SEO_CACHE }]);
    });
});
