import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { findDefaultValueForArgumentType } from '../argument-data-types-prefill-provider';

describe('findDefaultValueForArgumentType', () => {
    it('should create default value for scalar types', () => {
        expect(findDefaultValueForArgumentType('bool')).toBe('false');
        expect(findDefaultValueForArgumentType('f32')).toBe('1.0');
        expect(findDefaultValueForArgumentType('f64')).toBe('1.0');
        expect(findDefaultValueForArgumentType('string')).toBe('default');
        expect(findDefaultValueForArgumentType('bytes')).toBe('data');
    });
    it.each(['u8', 'u16', 'u32', 'u64', 'u128', 'u256', 'i8', 'i16', 'i32', 'i64', 'i128', 'i256'])(
        'should create default value for %s type',
        type => {
            expect(findDefaultValueForArgumentType(type)).toBe('1');
        },
    );
    it('should create empty default value for unknown types', () => {
        expect(findDefaultValueForArgumentType('UnknownType')).toBe('');
    });
    it('should create default value for pubkey type', () => {
        expect(findDefaultValueForArgumentType('pubkey')).toBe(PublicKey.default.toString());
    });
    it('should create default value for wrapped types', () => {
        expect(findDefaultValueForArgumentType({ vec: 'string' })).toBe('default');
        expect(findDefaultValueForArgumentType({ array: ['u8', 2] })).toBe('1, 1');
        expect(findDefaultValueForArgumentType({ array: ['string', 3] })).toBe('default, default, default');
        expect(findDefaultValueForArgumentType({ array: ['u8', 1] })).toBe('1');
        expect(findDefaultValueForArgumentType({ option: 'bool' })).toBe('false');
        expect(findDefaultValueForArgumentType({ coption: 'f64' })).toBe('1.0');
        expect(findDefaultValueForArgumentType({ vec: { array: ['string', 2] } })).toBe('default, default');
    });
});
