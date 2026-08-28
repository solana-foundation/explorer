import { lamports } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { parseSupplyPayload, type Supply, toSupply, toSupplyPayload } from '../supply';

// Above 2^53, so a payload that travelled as a JSON number would come back rounded.
const SUPPLY: Supply = {
    circulating: lamports(510_345_678_123_456_789n),
    total: lamports(590_469_135_111_111_110n),
};

/** One over `u64::MAX`, which is a run of legitimate-looking digits the struct alone cannot refuse. */
const ABOVE_U64 = '18446744073709551616';

describe('supply payload', () => {
    it('should round-trip a supply larger than a JS number can hold', () => {
        expect(parseSupplyPayload(toSupplyPayload(SUPPLY))).toEqual(SUPPLY);
    });

    it('should encode lamports as decimal strings', () => {
        expect(toSupplyPayload({ circulating: lamports(1n), total: lamports(3n) })).toEqual({
            circulating: '1',
            total: '3',
        });
    });

    // Encoding runs the same pair check as reading, so the route cannot serve figures its own client
    // would refuse — and refuses them once, server-side, rather than once per visitor.
    it.each([
        ['a circulating figure above the total', { circulating: 4n, total: 3n }],
        ['an amount outside the u64 range', { circulating: 1n, total: 2n ** 64n }],
    ])('should refuse %s rather than encode it', (_reason, supply) => {
        expect(() => toSupplyPayload(supply)).toThrow();
    });

    it('should accept a zero supply, which a fresh validator reports', () => {
        expect(parseSupplyPayload({ circulating: '0', total: '0' })).toEqual({
            circulating: 0n,
            total: 0n,
        });
    });

    it('should ignore a field nothing reads, so an older route stays readable', () => {
        expect(parseSupplyPayload({ circulating: '1', nonCirculating: '2', total: '3' })).toEqual({
            circulating: 1n,
            total: 3n,
        });
    });

    it.each([
        ['a missing field', { total: '3' }],
        ['a number where a string is expected', { circulating: 1, total: 3 }],
        ['an empty string', { circulating: '', total: '3' }],
        ['a non-numeric string', { circulating: 'lots', total: '3' }],
        // `BigInt('0x10')` is 16, so accepting hex would report a supply nobody holds.
        ['a hex string', { circulating: '0x10', total: '3' }],
        ['a negative amount', { circulating: '-1', total: '3' }],
        // Digits all the way down, so only the lamports range catches it.
        ['an amount above u64', { circulating: ABOVE_U64, total: '3' }],
        ['a body that is not an object', 'nope'],
        // Both fields pass on their own; only the pair says the figure is impossible. Left unchecked this
        // renders a share above 100%, or divides by zero when the total is the one that is wrong.
        ['a circulating figure above the total', { circulating: '4', total: '3' }],
        ['a swapped pair', { circulating: '590469135111111110', total: '510345678123456789' }],
        ['circulating out of nothing', { circulating: '5', total: '0' }],
    ])('should reject %s', (_reason, body) => {
        expect(() => parseSupplyPayload(body)).toThrow();
    });
});

describe('toSupply', () => {
    // The direct-RPC path builds a `Supply` here rather than through the wire struct, so the invariants
    // have to live in this one place to reach both.
    it('should refuse a circulating figure larger than the total', () => {
        expect(() => toSupply({ circulating: 4n, total: 3n })).toThrow();
    });

    it('should refuse an amount outside the u64 range', () => {
        expect(() => toSupply({ circulating: -1n, total: 3n })).toThrow();
    });

    it('should accept a supply entirely in circulation', () => {
        expect(toSupply({ circulating: 3n, total: 3n })).toEqual({ circulating: 3n, total: 3n });
    });

    // Kit types the RPC result `bigint` without checking, so a node's figures arrive here as they came.
    // Every one of these clears the range and pair checks — `undefined < 0` and `'510' > '590'` are both
    // false — and would render as an abbreviated number the visitor has no reason to doubt.
    it.each([
        ['an absent count', { total: 3n }],
        ['a null count', { circulating: null, total: 3n }],
        ['a NaN count', { circulating: NaN, total: 3n }],
        ['a pair of numeric strings', { circulating: '510345678123456789', total: '590469135111111110' }],
        ['a pair of JSON numbers', { circulating: 1, total: 3 }],
        ['an object where a count belongs', { circulating: {}, total: 3n }],
    ])('should refuse %s rather than report it as supply', (_reason, counts) => {
        expect(() => toSupply(counts)).toThrow();
    });

    // The same guard on the way out, so a node the route trusts cannot put one past the client either.
    it('should refuse a non-bigint count before encoding it', () => {
        expect(() => toSupplyPayload({ circulating: '1', total: '3' })).toThrow();
    });
});
