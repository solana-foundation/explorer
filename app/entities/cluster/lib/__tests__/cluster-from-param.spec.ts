import { describe, expect, it } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { clusterFromParam } from '../cluster-from-param';

describe('clusterFromParam', () => {
    it('should parse each known cluster value', () => {
        expect(clusterFromParam('0')).toBe(Cluster.MainnetBeta);
        expect(clusterFromParam('1')).toBe(Cluster.Testnet);
        expect(clusterFromParam('2')).toBe(Cluster.Devnet);
        expect(clusterFromParam('3')).toBe(Cluster.Simd296);
        expect(clusterFromParam('4')).toBe(Cluster.Custom);
    });

    it('should return undefined for out-of-range numbers', () => {
        expect(clusterFromParam('5')).toBeUndefined();
        expect(clusterFromParam('-1')).toBeUndefined();
        expect(clusterFromParam('999')).toBeUndefined();
    });

    it('should return undefined for non-numeric strings', () => {
        expect(clusterFromParam('mainnet-beta')).toBeUndefined();
        expect(clusterFromParam('')).toBeUndefined();
        expect(clusterFromParam('NaN')).toBeUndefined();
    });
});
