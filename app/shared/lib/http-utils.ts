import { NextResponse } from 'next/server';

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
