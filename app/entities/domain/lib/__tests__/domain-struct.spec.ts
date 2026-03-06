import { is } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { Domain } from '../domain-struct';

describe('Domain struct', () => {
    it.each([
        ['test.sol'],
        ['sub.domain.sol'],
        ['a.b'],
        ['UPPER.SOL'],
    ])('should accept valid domain: %s', (input) => {
        expect(is(input, Domain)).toBe(true);
    });

    it.each([
        ['', 'empty string'],
        ['notadomain', 'no dot'],
        ['has spaces.sol', 'contains spaces'],
        ['foo.sol/path', 'contains path'],
        ['foo.sol:8080', 'contains port'],
        ['.', 'bare dot'],
        ['.sol', 'leading dot'],
        ['test.', 'trailing dot'],
        ['a..b', 'consecutive dots'],
        ['...', 'only dots'],
        ['test.sol.', 'trailing dot with TLD'],
        ['1.2.3.4', 'IPv4 address'],
    ])('should reject invalid input: %s (%s)', (input) => {
        expect(is(input, Domain)).toBe(false);
    });
});
