import { describe, expect, it } from 'vitest';

import { numberWithSeparator } from '../index';

describe('numberWithSeparator', () => {
    it.each([
        ['123', '123'],
        ['1234567', '1,234,567'],
        ['-1234567', '-1,234,567'],
        ['340282366920938463463374607431768211455', '340,282,366,920,938,463,463,374,607,431,768,211,455'],
    ])('should group the digits of %s', (value, expected) => {
        expect(numberWithSeparator(value)).toBe(expected);
    });

    it('should leave the fraction digits ungrouped', () => {
        expect(numberWithSeparator('1234.5678')).toBe('1,234.5678');
    });

    it.each(['NaN', 'Infinity', '1e+21'])('should return %s unchanged', value => {
        expect(numberWithSeparator(value)).toBe(value);
    });
});
