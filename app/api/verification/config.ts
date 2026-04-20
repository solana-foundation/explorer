export const CACHE_MAX_AGE = 14400;
export const ERROR_CACHE_MAX_AGE = 30;

export const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=3600`,
};
export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

// Short negative cache for upstream/transient failures. Keeps one origin hit
// from fanning out into a stampede when a popular mint's verification fails.
// Not for misconfig or invalid input — those should recover instantly.
export const ERROR_CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${ERROR_CACHE_MAX_AGE}, s-maxage=${ERROR_CACHE_MAX_AGE}`,
};
