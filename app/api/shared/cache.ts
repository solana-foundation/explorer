/**
 * Creates cache-control headers for API responses
 * @param duration - Cache duration in seconds
 * @param staleWhileRevalidate - Time window for serving stale content while revalidating (default: 2 seconds)
 */
export function createCacheHeaders(duration: number, staleWhileRevalidate = 2) {
    return {
        'Cache-Control': `public, s-maxage=${duration}, stale-while-revalidate=${staleWhileRevalidate}`,
    };
}
