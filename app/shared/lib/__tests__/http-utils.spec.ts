import { describe, expect, it } from 'vitest';

import { ifNoneMatchMatches, isTimeoutError, notModifiedResponse } from '../http-utils';

describe('ifNoneMatchMatches', () => {
    it.each([
        { etag: '"abc"', expected: false, ifNoneMatch: undefined, scenario: 'the header is missing' },
        { etag: '"abc"', expected: false, ifNoneMatch: '', scenario: 'the header is empty' },
        { etag: '"abc"', expected: false, ifNoneMatch: '   ', scenario: 'the header is only whitespace' },
        { etag: '"any-etag"', expected: true, ifNoneMatch: '*', scenario: 'the header is *' },
        { etag: '"any-etag"', expected: true, ifNoneMatch: '  *  ', scenario: 'the header is * with whitespace' },
        { etag: '"abc"', expected: true, ifNoneMatch: '"abc"', scenario: 'a single tag matches the etag exactly' },
        { etag: '"xyz"', expected: false, ifNoneMatch: '"abc"', scenario: 'a single tag does not match the etag' },
        { etag: '"b"', expected: true, ifNoneMatch: '"a", "b", "c"', scenario: 'one of comma-separated tags matches' },
        { etag: '"z"', expected: false, ifNoneMatch: '"a", "b", "c"', scenario: 'no comma-separated tag matches' },
        { etag: '"abc"', expected: true, ifNoneMatch: 'W/"abc"', scenario: 'only the client tag has the W/ prefix' },
        { etag: 'W/"abc"', expected: true, ifNoneMatch: '"abc"', scenario: 'only the resource etag has the W/ prefix' },
        { etag: 'W/"x"', expected: true, ifNoneMatch: 'W/"x"', scenario: 'both tags have the W/ prefix' },
        { etag: '"b"', expected: true, ifNoneMatch: '  "a" , "b" ,  "c"  ', scenario: 'listed tags have whitespace' },
    ])('should return $expected when $scenario', ({ etag, expected, ifNoneMatch }) => {
        const headers = new Headers(ifNoneMatch === undefined ? {} : { 'If-None-Match': ifNoneMatch });
        expect(ifNoneMatchMatches(headers, etag)).toBe(expected);
    });
});

describe('notModifiedResponse', () => {
    it('should return a 304 response with a null body', () => {
        const res = notModifiedResponse({
            cacheHeaders: {},
            etag: '"abc"',
        });
        expect(res.status).toBe(304);
        expect(res.body).toBeNull();
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
