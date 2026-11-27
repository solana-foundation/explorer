import { is } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { AddressFromString } from '../address.js';

describe('AddressFromString', () => {
    it('should accept a base58 address', () => {
        expect(is('11111111111111111111111111111111', AddressFromString)).toBe(true);
    });

    it('should reject a value that is not a base58 address', () => {
        expect([123, 'not-an-address', ''].map(value => is(value, AddressFromString))).toEqual([false, false, false]);
    });
});
