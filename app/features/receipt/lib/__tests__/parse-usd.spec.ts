import { parseUsdNumber, prorateUsd } from '../parse-usd';

describe('parseUsdNumber', () => {
    it.each<[string, number]>([
        ['~200.00 USD', 200],
        ['~1,234.56 USD', 1234.56],
        ['$200.00', 200],
        ['$1,234.56', 1234.56],
        ['42.5', 42.5],
    ])('should parse number from %s', (input, expected) => {
        expect(parseUsdNumber(input)).toBe(expected);
    });

    it.each<[string]>([['not a price'], [''], ['Infinity'], ['-Infinity'], ['NaN']])(
        'should parse non-number "%s" as null',
        input => {
            expect(parseUsdNumber(input)).toBeNull();
        },
    );
});

describe('prorateUsd', () => {
    it.each<[number, number, number, string]>([
        [1_000_000_000, 1_000_000_000, 200, '~200.00 USD'],
        [250_000_000, 1_000_000_000, 200, '~50.00 USD'],
        [1, 3, 1, '~0.33 USD'],
        [1, 1, 1234567.89, '~1,234,567.89 USD'],
        [5, 10, 20, '~10.00 USD'],
    ])('should prorate transfer=%i of total=%i at USD=%i to %s', (transferRaw, totalRaw, totalUsd, expected) => {
        expect(prorateUsd(transferRaw, totalRaw, totalUsd)).toBe(expected);
    });

    it.each<[number, number, number]>([
        [0, 0, 100],
        [50, 0, 100],
    ])('should return empty string when totalRaw is zero (transfer=%i, usd=%i)', (transferRaw, totalRaw, totalUsd) => {
        expect(prorateUsd(transferRaw, totalRaw, totalUsd)).toBe('');
    });
});
