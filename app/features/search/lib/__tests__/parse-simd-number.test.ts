import { describe, expect, it } from 'vitest';

import { parseSimdNumber, parseSimdQuery } from '../parse-simd-number';

describe('parseSimdQuery', () => {
    it.each([
        ['148', 148],
        ['0148', 148],
        ['00148', 148],
        ['simd148', 148],
        ['SIMD0148', 148],
        ['simd 148', 148],
        ['SIMD-0148', 148],
        ['simd - 148', 148],
        ['  simd 148  ', 148],
        ['  148  ', 148],
        ['0', 0],
    ])('should parse "%s" as SIMD %i', (input, expected) => {
        expect(parseSimdQuery(input)).toBe(expected);
    });

    it.each([
        ['empty string', ''],
        ['whitespace', '  '],
        ['the bare prefix', 'simd'],
        ['the prefix and a separator', 'simd-'],
        ['non-numeric', 'simd-abc'],
        ['a title', 'MoveStake'],
        ['a negative number', '-148'],
        ['a float', '148.5'],
        ['a hex literal', '0x10'],
        ['exponent notation', '1e3'],
        ['digits split by a space', '14 8'],
    ])('should return undefined for %s', (_label, input) => {
        expect(parseSimdQuery(input)).toBeUndefined();
    });
});

describe('parseSimdNumber', () => {
    it.each([
        ['148', 148],
        ['0148', 148],
        [' 0189', 189],
        ['0337 ', 337],
    ])('should parse the registry entry "%s" as SIMD %i', (input, expected) => {
        expect(parseSimdNumber(input)).toBe(expected);
    });

    it.each([
        ['an empty entry', ''],
        ['a whitespace-only entry', ' '],
        ['a prefixed entry', 'simd148'],
        ['a range', '148-149'],
    ])('should return undefined for %s', (_label, input) => {
        expect(parseSimdNumber(input)).toBeUndefined();
    });

    it('should compare the padded and unpadded spellings equal', () => {
        expect(parseSimdNumber('0337')).toBe(parseSimdNumber('337'));
        expect(parseSimdNumber(' 0189')).toBe(parseSimdQuery('SIMD-189'));
    });
});
