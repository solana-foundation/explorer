import { describe, expect, it } from 'vitest';

import { ifNoneMatchMatches, notModifiedResponse } from '../http-utils';

describe('ifNoneMatchMatches', () => {
    it('returns false when If-None-Match header is missing', () => {
        const headers = new Headers();
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(false);
    });

    it('returns false when If-None-Match header is empty', () => {
        const headers = new Headers({ 'If-None-Match': '' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(false);
    });

    it('returns false when If-None-Match header is only whitespace', () => {
        const headers = new Headers({ 'If-None-Match': '   ' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(false);
    });

    it('returns true when If-None-Match is *', () => {
        const headers = new Headers({ 'If-None-Match': '*' });
        expect(ifNoneMatchMatches(headers, '"any-etag"')).toBe(true);
    });

    it('returns true when If-None-Match is * with surrounding whitespace', () => {
        const headers = new Headers({ 'If-None-Match': '  *  ' });
        expect(ifNoneMatchMatches(headers, '"any-etag"')).toBe(true);
    });

    it('returns true when single tag matches etag exactly', () => {
        const headers = new Headers({ 'If-None-Match': '"abc"' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(true);
    });

    it('returns false when single tag does not match etag', () => {
        const headers = new Headers({ 'If-None-Match': '"abc"' });
        expect(ifNoneMatchMatches(headers, '"xyz"')).toBe(false);
    });

    it('returns true when one of comma-separated tags matches', () => {
        const headers = new Headers({ 'If-None-Match': '"a", "b", "c"' });
        expect(ifNoneMatchMatches(headers, '"b"')).toBe(true);
    });

    it('returns false when no comma-separated tag matches', () => {
        const headers = new Headers({ 'If-None-Match': '"a", "b", "c"' });
        expect(ifNoneMatchMatches(headers, '"z"')).toBe(false);
    });

    it('uses weak comparison: W/ prefix is stripped from client tag', () => {
        const headers = new Headers({ 'If-None-Match': 'W/"abc"' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(true);
    });

    it('uses weak comparison: W/ prefix is stripped from resource etag', () => {
        const headers = new Headers({ 'If-None-Match': '"abc"' });
        expect(ifNoneMatchMatches(headers, 'W/"abc"')).toBe(true);
    });

    it('uses weak comparison: both W/ prefixes stripped and compared', () => {
        const headers = new Headers({ 'If-None-Match': 'W/"x"' });
        expect(ifNoneMatchMatches(headers, 'W/"x"')).toBe(true);
    });

    it('trims whitespace around tags in comma-separated list', () => {
        const headers = new Headers({ 'If-None-Match': '  "a" , "b" ,  "c"  ' });
        expect(ifNoneMatchMatches(headers, '"b"')).toBe(true);
    });
});

describe('notModifiedResponse', () => {
    it('returns response with status 304', () => {
        const res = notModifiedResponse({
            cacheHeaders: {},
            etag: '"abc"',
        });
        expect(res.status).toBe(304);
    });

    it('includes ETag in response headers', () => {
        const res = notModifiedResponse({
            cacheHeaders: {},
            etag: '"my-etag"',
        });
        expect(res.headers.get('ETag')).toBe('"my-etag"');
    });

    it('merges cache headers with ETag', () => {
        const res = notModifiedResponse({
            cacheHeaders: {
                'Cache-Control': 'public, max-age=3600',
            },
            etag: '"v1"',
        });
        expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
        expect(res.headers.get('ETag')).toBe('"v1"');
    });

    it('returns null body', () => {
        const res = notModifiedResponse({
            cacheHeaders: {},
            etag: '"x"',
        });
        expect(res.body).toBeNull();
    });
});
