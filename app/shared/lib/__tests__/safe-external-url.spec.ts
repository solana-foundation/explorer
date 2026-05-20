import { describe, expect, it } from 'vitest';

import { getSafeExternalUrl, isSafeExternalUrl } from '../safe-external-url';

describe('safe external URLs', () => {
    it('accepts trimmed http and https URLs and returns normalized hrefs', () => {
        expect(getSafeExternalUrl(' HTTPS://Example.COM/Path ')).toBe('https://example.com/Path');
        expect(getSafeExternalUrl('http://localhost:3000/test')).toBe('http://localhost:3000/test');
    });

    it('rejects non-http protocols and malformed values', () => {
        expect(getSafeExternalUrl('javascript:alert(1)')).toBeNull();
        expect(getSafeExternalUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBeNull();
        expect(getSafeExternalUrl('mailto:security@example.com')).toBeNull();
        expect(getSafeExternalUrl('/relative/path')).toBeNull();
        expect(getSafeExternalUrl('')).toBeNull();
        expect(getSafeExternalUrl(undefined)).toBeNull();
    });

    it('exposes the same validation via the type guard', () => {
        expect(isSafeExternalUrl('https://solana.com')).toBe(true);
        expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    });
});
