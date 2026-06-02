import { describe, expect, it } from 'vitest';

import { normalizeRepoUrl } from '../verified-builds-url';

describe('normalizeRepoUrl', () => {
    it('should strip a trailing .git suffix so callers can append /tree/<sha>', () => {
        expect(normalizeRepoUrl('https://github.com/foo/bar.git')).toBe('https://github.com/foo/bar');
    });

    it('should return the URL unchanged when it has no .git suffix', () => {
        expect(normalizeRepoUrl('https://github.com/foo/bar')).toBe('https://github.com/foo/bar');
    });

    it('should return undefined when input is undefined', () => {
        expect(normalizeRepoUrl(undefined)).toBeUndefined();
    });

    it('should leave a mid-path .git alone (raw inputs never contain it; that case is handled by normalizeOsecRepoUrl)', () => {
        expect(normalizeRepoUrl('https://github.com/foo/bar.git/tree/abc')).toBe(
            'https://github.com/foo/bar.git/tree/abc',
        );
    });
});
