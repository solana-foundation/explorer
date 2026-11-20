import { type Address, address } from '@solana/kit';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { getOwn } from '../object';

describe('getOwn', () => {
    it('should return the value of an own property', () => {
        const parsed: Record<string, number> = JSON.parse('{"devnet": 1, "__proto__": 2}');

        expect(getOwn(parsed, 'devnet')).toBe(1);
        expect(getOwn(parsed, '__proto__')).toBe(2);
    });

    it('should return undefined for an inherited or absent key', () => {
        const clusters: Record<string, number> = { devnet: 1 };

        expect(getOwn(clusters, 'constructor')).toBeUndefined();
        expect(getOwn(clusters, '__proto__')).toBeUndefined();
        expect(getOwn(clusters, 'testnet')).toBeUndefined();
    });

    it('should type a read through an index signature as possibly undefined', () => {
        const byName: Record<string, number> = {};
        const byAddress: Record<Address, number> = {};

        expectTypeOf(getOwn(byName, 'devnet')).toEqualTypeOf<number | undefined>();
        expectTypeOf(getOwn(byAddress, address('11111111111111111111111111111111'))).toEqualTypeOf<
            number | undefined
        >();
    });

    it('should type a read of a literal key as defined', () => {
        const byCluster: Record<'devnet' | 'testnet', number> = { devnet: 1, testnet: 2 };

        expectTypeOf(getOwn(byCluster, 'devnet')).toEqualTypeOf<number>();
    });
});
