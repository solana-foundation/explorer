import { describe, expect, it } from 'vitest';

import { getSafeExternalHref, parseUrl } from '../url';

describe('parseUrl', () => {
    it('should parse absolute URLs', () => {
        expect(parseUrl('https://example.com/x')?.protocol).toBe('https:');
    });

    it.each([undefined, null, ''])('should return undefined for empty input: %p', value => {
        expect(parseUrl(value)).toBeUndefined();
    });

    it.each(['not a url', '/relative/path', 'http://'])('should return undefined for malformed input: %s', value => {
        expect(parseUrl(value)).toBeUndefined();
    });
});

describe('getSafeExternalHref', () => {
    it.each(['http://example.com', 'https://arweave.net/abc', 'HTTPS://EXAMPLE.COM'])(
        'should return the URL for http(s): %s',
        value => {
            expect(getSafeExternalHref(value)).toBe(value);
        },
    );

    it.each([
        'javascript:alert(1)',
        'JavaScript:alert(document.cookie)',
        'java\nscript:alert(1)', // URL parser strips the newline → still javascript:
        '\tjavascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        'ipfs://bafy', // valid URL, but no browser handler — not a safe http(s) link
        'ar://abc',
        'mailto:a@b.com',
        '', // empty
        'not a url',
        '/relative',
    ])('should return undefined for unsafe or non-http(s): %s', value => {
        expect(getSafeExternalHref(value)).toBeUndefined();
    });

    it.each([undefined, null])('should return undefined for nullish input: %p', value => {
        expect(getSafeExternalHref(value)).toBeUndefined();
    });
});
