export const CACHE_MAX_AGE = 14400;
export const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=3600`,
};
export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
