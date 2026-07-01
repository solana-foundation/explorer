import { NextResponse } from 'next/server';

export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export const UPSTREAM_TIMEOUT_MS = 30_000;

export const CACHE_MAX_AGE = 14400; // 4 hours
export const ERROR_CACHE_MAX_AGE = 30; // seconds

export const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=3600`,
};

export const ERROR_CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${ERROR_CACHE_MAX_AGE}, s-maxage=${ERROR_CACHE_MAX_AGE}`,
};

// Passing a signal opts out of Next.js's dedupe-fetch wrapper (calls
// response.body.tee() on every GET). Some upstream gzip/chunked bodies yield
// a body undici can't tee — throws "body.tee is not a function".
export function fetchUpstream(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
}

// AbortSignal.timeout rejects with a DOMException named 'TimeoutError'.
export function isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'TimeoutError';
}

/**
 * True if If-None-Match implies the client has a valid copy (return 304).
 * Uses weak comparison per RFC 7232 Section 3.2 (opaque-tags match character-by-character).
 */
export function ifNoneMatchMatches(headers: Headers, etag: string): boolean {
    const ifNoneMatch = headers.get('if-none-match');

    if (!ifNoneMatch || !ifNoneMatch.trim()) return false;
    if (ifNoneMatch.trim() === '*') return true;
    const want = opaqueTag(etag);
    const tags = ifNoneMatch.split(',').map(t => opaqueTag(t.trim()));
    return tags.some(tag => tag === want);
}

export function notModifiedResponse({ cacheHeaders, etag }: { etag: string; cacheHeaders: HeadersInit }): NextResponse {
    // A 304 has no body; `null` is the explicit bodyless Response value.
    // eslint-disable-next-line unicorn/no-null
    return new NextResponse(null, {
        headers: { ...cacheHeaders, ETag: etag },
        status: 304,
    });
}

/** Normalise ETag for weak comparison (RFC 7232): strip optional W/ prefix only. */
function opaqueTag(etag: string): string {
    const s = etag.trim();
    if (s.startsWith('W/')) return s.slice(2).trim();
    return s;
}
