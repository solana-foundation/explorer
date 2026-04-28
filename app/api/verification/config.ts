export const CACHE_MAX_AGE = 14400;
export const ERROR_CACHE_MAX_AGE = 30;

export const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=3600`,
};

export const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store',
};

export const ERROR_CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${ERROR_CACHE_MAX_AGE}, s-maxage=${ERROR_CACHE_MAX_AGE}`,
};
