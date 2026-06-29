import { parseProposals, resolveMissingSimdLinks, resolveSimdLinks } from '../simd-proposals';

// resolveMissingSimdLinks logs CLI progress via console.log; silence it under test.
beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

const PROPOSALS = parseProposals([
    { html_url: 'https://github.com/sf/simd/blob/main/proposals/0148-x.md', name: '0148-x.md' },
    { html_url: 'https://github.com/sf/simd/blob/main/proposals/0337-y.md', name: '0337-y.md' },
    { html_url: 'https://github.com/sf/simd/blob/main/proposals/0500-z.md', name: '0500-z.md' },
]);

function feature(overrides: { simds: string[]; simd_link: string[] }) {
    return { description: '', key: 'KEY', ...overrides };
}

describe('resolveMissingSimdLinks', () => {
    it('should leave features whose simd_link entries are all populated untouched', () => {
        const input = [feature({ simd_link: ['https://existing/148'], simds: ['148'] })];
        const result = resolveMissingSimdLinks(input, PROPOSALS);
        expect(result[0]).toBe(input[0]);
    });

    it('should leave features with empty simds untouched', () => {
        const input = [feature({ simd_link: [], simds: [] })];
        const result = resolveMissingSimdLinks(input, PROPOSALS);
        expect(result[0]).toBe(input[0]);
    });

    it('should back-fill simd_link when an entry is the empty string', () => {
        const input = [feature({ simd_link: [''], simds: ['337'] })];
        const [result] = resolveMissingSimdLinks(input, PROPOSALS);
        expect(result.simd_link).toEqual(['https://github.com/sf/simd/blob/main/proposals/0337-y.md']);
    });

    it('should back-fill when simd_link is shorter than simds', () => {
        const input = [feature({ simd_link: [], simds: ['148', '337'] })];
        const [result] = resolveMissingSimdLinks(input, PROPOSALS);
        expect(result.simd_link).toEqual([
            'https://github.com/sf/simd/blob/main/proposals/0148-x.md',
            'https://github.com/sf/simd/blob/main/proposals/0337-y.md',
        ]);
    });

    it('should preserve existing non-empty entries when only some slots are empty', () => {
        const input = [feature({ simd_link: ['https://existing/148', ''], simds: ['148', '337'] })];
        const [result] = resolveMissingSimdLinks(input, PROPOSALS);
        expect(result.simd_link).toEqual([
            'https://existing/148',
            'https://github.com/sf/simd/blob/main/proposals/0337-y.md',
        ]);
    });

    it('should leave empty slots empty when the SIMD number is not in the proposals listing', () => {
        // No proposal for 999 → can't fill in, slot stays empty, row is not "improved" → object identity preserved.
        const input = [feature({ simd_link: [''], simds: ['999'] })];
        const result = resolveMissingSimdLinks(input, PROPOSALS);
        expect(result[0]).toBe(input[0]);
    });

    it('should pass through features unchanged when the proposals map is empty', () => {
        const input = [feature({ simd_link: [''], simds: ['148'] })];
        const result = resolveMissingSimdLinks(input, new Map());
        expect(result[0]).toBe(input[0]);
    });
});

describe('resolveSimdLinks', () => {
    it('should emit empty strings for non-numeric SIMD entries', () => {
        expect(resolveSimdLinks('148, n/a, 337', PROPOSALS)).toEqual([
            'https://github.com/sf/simd/blob/main/proposals/0148-x.md',
            '',
            'https://github.com/sf/simd/blob/main/proposals/0337-y.md',
        ]);
    });
});
