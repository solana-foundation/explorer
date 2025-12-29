import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { findDefaultValueForArgumentType } from '../argument-data-types-prefill-provider';

describe('findDefaultValueForArgumentType', () => {
    it('should create default value for scalar types', () => {
        expect(findDefaultValueForArgumentType('bool')).toBe('false');
        expect(findDefaultValueForArgumentType('f32')).toBe('1.0');
        expect(findDefaultValueForArgumentType('f64')).toBe('1.0');
        expect(findDefaultValueForArgumentType('i32')).toBe('1');
        expect(findDefaultValueForArgumentType('i128')).toBe('1');
        expect(findDefaultValueForArgumentType('u8')).toBe('1');
        expect(findDefaultValueForArgumentType('u64')).toBe('1');
        expect(findDefaultValueForArgumentType('string')).toBe('default');
    });
    it('should create default value for pubkey type', () => {
        expect(findDefaultValueForArgumentType('pubkey')).toBe(PublicKey.default.toString());
    });
    it('should create default value for wrapped types', () => {
        expect(findDefaultValueForArgumentType({ vec: 'string' })).toBe('default');
        expect(findDefaultValueForArgumentType({ array: ['u8', 2] })).toBe('1');
        expect(findDefaultValueForArgumentType({ option: 'bool' })).toBe('false');
        expect(findDefaultValueForArgumentType({ coption: 'f64' })).toBe('1.0');
        expect(findDefaultValueForArgumentType({ vec: { array: ['string', 2] } })).toBe('default');
    });
});
