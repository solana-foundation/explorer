import { describe, expect, it } from 'vitest';

import { trimNullPadding } from '../trim-null-padding';

describe('trimNullPadding', () => {
    it.each([
        { expected: 'MAD', value: 'MAD\0\0\0\0\0\0\0' },
        { expected: '', value: '\0\0\0\0\0\0\0\0\0\0' },
        { expected: 'Mad Lads #4901', value: 'Mad Lads #4901' },
        { expected: '', value: '' },
    ])('should turn $value into $expected', ({ value, expected }) => {
        expect(trimNullPadding(value)).toBe(expected);
    });

    it('should keep a NUL that is not trailing', () => {
        expect(trimNullPadding('A\0B\0')).toBe('A\0B');
    });
});
