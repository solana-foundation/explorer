import { describe, expect, it } from 'vitest';

import { ifNoneMatchMatches, isTimeoutError, notModifiedResponse } from '../http-utils';

describe('ifNoneMatchMatches', () => {
    it('should return false when If-None-Match header is missing', () => {
        const headers = new Headers();
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(false);
    });

    it('should return false when If-None-Match header is empty', () => {
        const headers = new Headers({ 'If-None-Match': '' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(false);
    });

    it('should return false when If-None-Match header is only whitespace', () => {
        const headers = new Headers({ 'If-None-Match': '   ' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(false);
    });

    it('should return true when If-None-Match is *', () => {
        const headers = new Headers({ 'If-None-Match': '*' });
        expect(ifNoneMatchMatches(headers, '"any-etag"')).toBe(true);
    });

    it('should return true when If-None-Match is * with surrounding whitespace', () => {
        const headers = new Headers({ 'If-None-Match': '  *  ' });
        expect(ifNoneMatchMatches(headers, '"any-etag"')).toBe(true);
    });

    it('should return true when single tag matches etag exactly', () => {
        const headers = new Headers({ 'If-None-Match': '"abc"' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(true);
    });

    it('should return false when single tag does not match etag', () => {
        const headers = new Headers({ 'If-None-Match': '"abc"' });
        expect(ifNoneMatchMatches(headers, '"xyz"')).toBe(false);
    });

    it('should return true when one of comma-separated tags matches', () => {
        const headers = new Headers({ 'If-None-Match': '"a", "b", "c"' });
        expect(ifNoneMatchMatches(headers, '"b"')).toBe(true);
    });

    it('should return false when no comma-separated tag matches', () => {
        const headers = new Headers({ 'If-None-Match': '"a", "b", "c"' });
        expect(ifNoneMatchMatches(headers, '"z"')).toBe(false);
    });

    it('should use weak comparison: W/ prefix is stripped from client tag', () => {
        const headers = new Headers({ 'If-None-Match': 'W/"abc"' });
        expect(ifNoneMatchMatches(headers, '"abc"')).toBe(true);
    });

    it('should use weak comparison: W/ prefix is stripped from resource etag', () => {
        const headers = new Headers({ 'If-None-Match': '"abc"' });
        expect(ifNoneMatchMatches(headers, 'W/"abc"')).toBe(true);
    });

    it('should use weak comparison: both W/ prefixes stripped and compared', () => {
        const headers = new Headers({ 'If-None-Match': 'W/"x"' });
        expect(ifNoneMatchMatches(headers, 'W/"x"')).toBe(true);
    });

    it('should trim whitespace around tags in comma-separated list', () => {
        const headers = new Headers({ 'If-None-Match': '  "a" , "b" ,  "c"  ' });
        expect(ifNoneMatchMatches(headers, '"b"')).toBe(true);
    });
});

describe('notModifiedResponse', () => {
    it('should return response with status 304', () => {
        const res = notModifiedResponse({
            cacheHeaders: {},
            etag: '"abc"',
        });
        expect(res.status).toBe(304);
    });

    it('should include ETag in response headers', () => {
        const res = notModifiedResponse({
            cacheHeaders: {},
            etag: '"my-etag"',
        });
        expect(res.headers.get('ETag')).toBe('"my-etag"');
    });

    it('should merge cache headers with ETag', () => {
        const res = notModifiedResponse({
            cacheHeaders: {
                'Cache-Control': 'public, max-age=3600',
            },
            etag: '"v1"',
        });
        expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
        expect(res.headers.get('ETag')).toBe('"v1"');
    });

    it('should return null body', () => {
        const res = notModifiedResponse({
            cacheHeaders: {},
            etag: '"x"',
        });
        expect(res.body).toBeNull();
    });
});

describe('isTimeoutError', () => {
    it('should be true for a TimeoutError DOMException', () => {
        expect(isTimeoutError(new DOMException('Signal timed out.', 'TimeoutError'))).toBe(true);
    });

    it('should be false for other errors', () => {
        expect(isTimeoutError(new Error('nope'))).toBe(false);
        expect(isTimeoutError(new DOMException('aborted', 'AbortError'))).toBe(false);
    });
});
