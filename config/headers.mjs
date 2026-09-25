const SEO_FILE_HEADERS = [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }];

const SITEMAP_PATHS = ['/sitemap.xml', '/default-sitemap.xml', '/accounts-sitemap.xml'];

/**
 * Next.js imports `next.config.mjs` without a bundler, so this file reads `SEO_DISALLOW_BOTS` instead of
 * importing `@utils/env`.
 * Next.js calls `headers()` at build time, so `X-Robots-Tag` needs `SEO_DISALLOW_BOTS` set for the build.
 *
 * @returns {Array<{ source: string; headers: Array<{ key: string; value: string }> }>}
 */
export function buildHeaders() {
    const headers = SITEMAP_PATHS.map(source => ({ headers: SEO_FILE_HEADERS, source }));

    if (process.env.SEO_DISALLOW_BOTS === 'true') {
        headers.push({ headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }], source: '/:path*' });
    }

    return headers;
}
