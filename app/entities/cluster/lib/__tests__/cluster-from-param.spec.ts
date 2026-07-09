import { describe, expect, it } from 'vitest';

import { Cluster } from '../cluster';
import { clusterFromParam, serverClusterUrlFromParam } from '../cluster-from-param';

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

describe('serverClusterUrlFromParam', () => {
    it('should resolve a known cluster to a non-empty server URL', () => {
        expect(serverClusterUrlFromParam('0')).toEqual(expect.any(String));
        expect(serverClusterUrlFromParam('0')).toBeTruthy();
    });

    it('should return undefined for a custom cluster (no server endpoint)', () => {
        // Custom resolves to an empty URL; the routes treat that as invalid (custom resolves client-side).
        expect(serverClusterUrlFromParam('4')).toBeUndefined();
    });

    it('should reject the same malformed params as clusterFromParam (no bare Number() coercion)', () => {
        expect(serverClusterUrlFromParam('999')).toBeUndefined();
        expect(serverClusterUrlFromParam('01')).toBeUndefined();
        expect(serverClusterUrlFromParam(' 0 ')).toBeUndefined();
        expect(serverClusterUrlFromParam('')).toBeUndefined();
    });
});
