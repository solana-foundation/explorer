const SEO_FILE_HEADERS = [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }];

// robots.txt is absent here: its route handler owns its own Cache-Control.
const SITEMAP_PATHS = ['/sitemap.xml', '/default-sitemap.xml', '/accounts-sitemap.xml'];

/**
 * Build the header table consumed by `next.config.mjs`.
 * Extracted so it can be unit-tested without loading the Sentry/BotID wrappers.
 *
 * Node loads the config unbundled, so this cannot import the TypeScript flag helper and re-checks
 * the variable itself. That also pins `X-Robots-Tag` to build time, unlike the request-time reads
 * elsewhere — set the variable for the build, not only for the runtime.
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
