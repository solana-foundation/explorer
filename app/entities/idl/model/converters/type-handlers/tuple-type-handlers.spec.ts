import { describe, expect, it } from 'vitest';

import { isHomogeneousTuple, parseHomogeneousTuple } from './tuple-type-handlers';

describe('parseHomogeneousTuple', () => {
    it('parses homogeneous u64 tuple', () => {
        const result = parseHomogeneousTuple(['u64', 'u64']);
        expect(result).toEqual({ array: ['u64', 2] });
    });

    it('parses homogeneous string tuple', () => {
        const result = parseHomogeneousTuple(['string', 'string', 'string']);
        expect(result).toEqual({ array: ['string', 3] });
    });

    it('parses single element tuple', () => {
        const result = parseHomogeneousTuple(['u8']);
        expect(result).toEqual({ array: ['u8', 1] });
    });

    it('returns null for empty array', () => {
        expect(parseHomogeneousTuple([])).toBeNull();
    });

    it('returns null for non-array input', () => {
        expect(parseHomogeneousTuple('u64')).toBeNull();
        expect(parseHomogeneousTuple(null)).toBeNull();
        expect(parseHomogeneousTuple(undefined)).toBeNull();
        expect(parseHomogeneousTuple({})).toBeNull();
    });

    it('returns null for heterogeneous tuple', () => {
        expect(parseHomogeneousTuple(['u64', 'u32'])).toBeNull();
        expect(parseHomogeneousTuple(['string', 'u64'])).toBeNull();
    });

    it('returns null for non-string element types', () => {
        expect(parseHomogeneousTuple([{ vec: 'u8' }, { vec: 'u8' }])).toBeNull();
        expect(
            parseHomogeneousTuple([
                ['u8', 32],
                ['u8', 32],
            ])
        ).toBeNull();
    });
});

describe('isHomogeneousTuple', () => {
    it('returns true for valid homogeneous tuples', () => {
        expect(isHomogeneousTuple(['u64', 'u64'])).toBe(true);
        expect(isHomogeneousTuple(['string'])).toBe(true);
    });

    it('returns false for invalid tuples', () => {
        expect(isHomogeneousTuple([])).toBe(false);
        expect(isHomogeneousTuple(['u64', 'u32'])).toBe(false);
        expect(isHomogeneousTuple(null)).toBe(false);
    });
});
