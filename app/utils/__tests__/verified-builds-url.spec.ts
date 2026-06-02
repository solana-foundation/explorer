import { describe, expect, it } from 'vitest';

import { normalizeRepoUrl } from '../verified-builds-url';

describe('normalizeRepoUrl', () => {
    it('should strip a trailing .git suffix so callers can append /tree/<sha>', () => {
        expect(normalizeRepoUrl('https://github.com/foo/bar.git')).toBe('https://github.com/foo/bar');
    });

    it('should strip a mid-path .git/ so /tree/<sha> resolves on GitHub', () => {
        expect(normalizeRepoUrl('https://github.com/foo/bar.git/tree/abc')).toBe('https://github.com/foo/bar/tree/abc');
    });

    it('should return the URL unchanged when it has no .git suffix', () => {
        expect(normalizeRepoUrl('https://github.com/foo/bar')).toBe('https://github.com/foo/bar');
        expect(normalizeRepoUrl('https://github.com/foo/bar/tree/abc')).toBe('https://github.com/foo/bar/tree/abc');
    });

    it('should return undefined when input is undefined', () => {
        expect(normalizeRepoUrl(undefined)).toBeUndefined();
    });
});
