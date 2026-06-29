import { describe, expect, it } from 'vitest';

import { composeOnchainRepoUrl, normalizeRepoUrl, safeRepoUrl } from '../verified-builds-url';
import osecStatusFixtures from './__fixtures__/osec-status.json';

describe('normalizeRepoUrl', () => {
    const happy: Array<[{ scenario: string; repoUrl: string }, string]> = [
        [
            { repoUrl: 'https://github.com/foo/bar.git', scenario: 'strip a trailing .git suffix' },
            'https://github.com/foo/bar',
        ],
        [
            { repoUrl: 'https://github.com/foo/bar.git/tree/abc', scenario: 'strip a mid-path .git/' },
            'https://github.com/foo/bar/tree/abc',
        ],
        [
            { repoUrl: 'https://github.com/foo/bar', scenario: 'return a plain URL unchanged when it has no .git' },
            'https://github.com/foo/bar',
        ],
        [
            {
                repoUrl: 'https://github.com/foo/bar/tree/abc',
                scenario: 'return a /tree/<sha> URL unchanged when it has no .git',
            },
            'https://github.com/foo/bar/tree/abc',
        ],
    ];
    happy.forEach(([{ scenario, repoUrl }, expected]) => {
        it(`should ${scenario}`, () => {
            expect(normalizeRepoUrl(repoUrl)).toBe(expected);
        });
    });

    const rejections: Array<{ scenario: string; repoUrl: string | undefined }> = [
        { repoUrl: undefined, scenario: 'return undefined when input is undefined' },
    ];
    rejections.forEach(({ scenario, repoUrl }) => {
        it(`should ${scenario}`, () => {
            expect(normalizeRepoUrl(repoUrl)).toBeUndefined();
        });
    });
});

describe('safeRepoUrl', () => {
    const happy: Array<[{ scenario: string; repoUrl: string }, string]> = [
        [
            { repoUrl: 'https://github.com/foo/bar', scenario: 'return a parseable https URL' },
            'https://github.com/foo/bar',
        ],
        [
            {
                repoUrl: 'https://github.com/foo/bar/tree/abc',
                scenario: 'return a parseable https URL with /tree/<sha>',
            },
            'https://github.com/foo/bar/tree/abc',
        ],
    ];
    happy.forEach(([{ scenario, repoUrl }, expected]) => {
        it(`should ${scenario}`, () => {
            expect(safeRepoUrl(repoUrl)).toBe(expected);
        });
    });

    const rejections: Array<{ scenario: string; repoUrl: string | undefined }> = [
        { repoUrl: 'http://github.com/foo/bar', scenario: 'return undefined for http scheme' },
        { repoUrl: 'javascript:alert(1)', scenario: 'return undefined for javascript: scheme' },
        { repoUrl: 'ftp://example.com/foo', scenario: 'return undefined for ftp scheme' },
        { repoUrl: 'not a url', scenario: 'return undefined for unparseable input' },
        { repoUrl: 'github.com/foo/bar', scenario: 'return undefined for a host-only string without scheme' },
        { repoUrl: undefined, scenario: 'return undefined when input is undefined' },
        { repoUrl: '', scenario: 'return undefined when input is empty' },
    ];
    rejections.forEach(({ scenario, repoUrl }) => {
        it(`should ${scenario}`, () => {
            expect(safeRepoUrl(repoUrl)).toBeUndefined();
        });
    });
});

describe('composeOnchainRepoUrl', () => {
    const happy: Array<[{ scenario: string; gitUrl: string; commit: string }, string]> = [
        [
            {
                commit: 'abc123',
                gitUrl: 'https://github.com/foo/bar',
                scenario: 'append /tree/<commit> when commit is non-empty',
            },
            'https://github.com/foo/bar/tree/abc123',
        ],
        [
            {
                commit: 'abc123',
                gitUrl: 'https://github.com/foo/bar.git',
                scenario: 'strip a trailing .git before appending /tree/<commit>',
            },
            'https://github.com/foo/bar/tree/abc123',
        ],
        [
            {
                commit: '',
                gitUrl: 'https://github.com/foo/bar.git',
                scenario: 'return the bare repo URL when commit is empty',
            },
            'https://github.com/foo/bar',
        ],
    ];
    happy.forEach(([{ scenario, gitUrl, commit }, expected]) => {
        it(`should ${scenario}`, () => {
            expect(composeOnchainRepoUrl(gitUrl, commit)).toBe(expected);
        });
    });

    const rejections: Array<{ scenario: string; gitUrl: string | undefined; commit: string }> = [
        { commit: 'abc123', gitUrl: undefined, scenario: 'return undefined when gitUrl is undefined' },
        { commit: 'abc123', gitUrl: '', scenario: 'return undefined when gitUrl is empty' },
        {
            commit: 'abc123',
            gitUrl: 'http://github.com/foo/bar',
            scenario: 'return undefined when the composed URL is not https',
        },
        { commit: '', gitUrl: 'javascript:alert(1)', scenario: 'return undefined for a javascript: gitUrl' },
    ];
    rejections.forEach(({ scenario, gitUrl, commit }) => {
        it(`should ${scenario}`, () => {
            expect(composeOnchainRepoUrl(gitUrl, commit)).toBeUndefined();
        });
    });
});

describe('OSec /status response handling', () => {
    it('should normalize a repo_url ending in .git (openbook_twap)', () => {
        const { repo_url } = osecStatusFixtures['twAP5sArq2vDS1mZCT7f4qRLwzTfHvf5Ay5R5Q5df1m'];
        expect(safeRepoUrl(normalizeRepoUrl(repo_url))).toBe('https://github.com/metaDAOproject/openbook-twap');
    });

    it('should normalize a repo_url with mid-path .git/ (candy_machine_core)', () => {
        const { repo_url } = osecStatusFixtures['CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J'];
        expect(safeRepoUrl(normalizeRepoUrl(repo_url))).toBe(
            'https://github.com/metaplex-foundation/mpl-core-candy-machine/tree/ea3620b7436004f62e1e7bc3d69147f4feef2ae0',
        );
    });

    it('should pass through a clean /tree/<sha> repo_url (squads_v4)', () => {
        const { repo_url } = osecStatusFixtures['SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf'];
        expect(safeRepoUrl(normalizeRepoUrl(repo_url))).toBe(
            'https://github.com/Squads-Protocol/v4/tree/6d5235da621a2e9b7379ea358e48760e981053be',
        );
    });
});
