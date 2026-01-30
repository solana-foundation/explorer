import { describe, expect, it } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { parseClusterId } from '../cluster';

describe('parseClusterId', () => {
    it('should return undefined when value is undefined', () => {
        expect(parseClusterId(undefined)).toBe(undefined);
    });

    it.each([
        ['1', Cluster.Testnet],
        ['2', Cluster.Devnet],
        ['3', Cluster.Simd296],
    ])('should return cluster for valid id "%s"', (input, expected) => {
        expect(parseClusterId(input)).toBe(expected);
    });

    // '0' is mainnet (not allowed), '4'/'999' out of range, 'devnet' → NaN, '' → 0 (mainnet)
    it.each(['0', '4', '999', 'devnet', ''])('should return undefined for invalid cluster id "%s"', input => {
        expect(parseClusterId(input)).toBe(undefined);
    });
});
