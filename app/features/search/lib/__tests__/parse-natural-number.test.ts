import { describe, expect, it } from 'vitest';

import { parseNaturalNumber } from '../parse-natural-number';

describe('parseNaturalNumber', () => {
    it.each([
        ['0', 0],
        ['1', 1],
        ['42', 42],
        ['300000000', 300000000],
    ])('should parse "%s" as %i', (input, expected) => {
        expect(parseNaturalNumber(input)).toBe(expected);
    });

    it.each([
        ['empty string', ''],
        ['whitespace', '  '],
        ['alphabetic', 'abc'],
        ['negative', '-1'],
        ['float', '1.5'],
        ['hex prefix', '0x10'],
        ['binary prefix', '0b10'],
        ['octal prefix', '0o10'],
        ['leading zero', '01'],
        ['Infinity', 'Infinity'],
        ['NaN', 'NaN'],
    ])('should return undefined for %s', (_label, input) => {
        expect(parseNaturalNumber(input)).toBeUndefined();
    });
});
