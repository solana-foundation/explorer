import { splitAtFirstNonZeroDigit } from '../split-at-first-non-zero-digit';

describe('splitAtFirstNonZeroDigit', () => {
    it.each<[string, { leadingZeros: string; significantDigits: string }]>([
        ['0.000123', { leadingZeros: '0.000', significantDigits: '123' }],
        ['0.024922118', { leadingZeros: '0.0', significantDigits: '24922118' }],
        ['0.1', { leadingZeros: '0.', significantDigits: '1' }],
    ])('should split leading zeros from "%s"', (input, expected) => {
        expect(splitAtFirstNonZeroDigit(input)).toEqual(expected);
    });

    it.each<[string]>([
        ['1.5'],
        ['1.4224'],
        ['42'],
        ['42.000021323'],
        ['1234.5678'],
        ['10.001'],
        ['0'],
        ['0.0'],
        [''],
        ['not a number'],
    ])('should not split "%s" (no leading 0.0…pattern)', input => {
        expect(splitAtFirstNonZeroDigit(input)).toEqual({ leadingZeros: '', significantDigits: input });
    });
});
