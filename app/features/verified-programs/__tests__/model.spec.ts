import { describe, expect, it } from 'vitest';

import { extractProgramNameFromRepo, getProgramName, isValidGitHubUrl } from '../model';

describe('isValidGitHubUrl', () => {
    it('should validate github.com URLs', () => {
        expect(isValidGitHubUrl('https://github.com/org/repo')).toBe(true);
        expect(isValidGitHubUrl('https://www.github.com/org/repo')).toBe(true);
    });

    it('should reject non-GitHub URLs', () => {
        expect(isValidGitHubUrl('https://gitlab.com/org/repo')).toBe(false);
        expect(isValidGitHubUrl('https://malicious.com/org/repo')).toBe(false);
    });

    it('should handle invalid URLs', () => {
        expect(isValidGitHubUrl('not-a-url')).toBe(false);
    });
});

describe('extractProgramNameFromRepo', () => {
    it('should extract name from GitHub URL', () => {
        expect(extractProgramNameFromRepo('https://github.com/Ellipsis-Labs/phoenix-v1')).toBe('Phoenix V1');
    });

    it('should handle underscores', () => {
        expect(extractProgramNameFromRepo('https://github.com/org/token_metadata')).toBe('Token Metadata');
    });

    it('should return null for invalid URLs', () => {
        expect(extractProgramNameFromRepo('not-a-url')).toBeNull();
    });

    it('should return null for non-GitHub URLs (security)', () => {
        expect(extractProgramNameFromRepo('https://malicious.com/org/repo')).toBeNull();
    });
});

describe('getProgramName', () => {
    it('should use repo name from GitHub URL', () => {
        expect(
            getProgramName(
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'https://github.com/solana-labs/solana-program-library',
            ),
        ).toBe('Solana Program Library');
    });

    it('should extract repo name correctly', () => {
        expect(getProgramName('unknown123', 'https://github.com/org/my-program')).toBe('My Program');
    });

    it('should fall back to address when no repo URL', () => {
        expect(getProgramName('12UJ...8KF')).toBe('12UJ...8KF');
    });

    it('should fall back to address for non-GitHub URLs', () => {
        expect(getProgramName('unknown123', 'https://malicious.com/org/repo')).toBe('unknown123');
    });
});
