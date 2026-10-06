import { afterEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '../cluster';
import { clusterFromParam, resolveServerClusterUrl, serverClusterUrlFromParam } from '../cluster-from-param';

// In a hook, not a test body: a failed assertion would otherwise leave a blanked env var to decide what
// the describes below resolve, turning one failure into a cascade.
afterEach(() => vi.unstubAllEnvs());

describe('clusterFromParam', () => {
    it('should parse each known cluster value', () => {
        expect(clusterFromParam('0')).toBe(Cluster.MainnetBeta);
        expect(clusterFromParam('1')).toBe(Cluster.Testnet);
        expect(clusterFromParam('2')).toBe(Cluster.Devnet);
        expect(clusterFromParam('3')).toBe(Cluster.Custom);
    });

    it('should return undefined for out-of-range numbers', () => {
        expect(clusterFromParam('4')).toBeUndefined();
        expect(clusterFromParam('-1')).toBeUndefined();
        expect(clusterFromParam('999')).toBeUndefined();
    });

    it('should return undefined for non-numeric strings', () => {
        expect(clusterFromParam('mainnet-beta')).toBeUndefined();
        expect(clusterFromParam('')).toBeUndefined();
        expect(clusterFromParam('NaN')).toBeUndefined();
    });
});

// A route that cannot tell these two apart either reports every caller's typo, or says nothing at all
// about its own deployment having no endpoint for a cluster it serves.
describe('resolveServerClusterUrl', () => {
    it('should resolve a known cluster', () => {
        expect(resolveServerClusterUrl('0')).toEqual({
            cluster: Cluster.MainnetBeta,
            kind: 'ok',
            url: expect.any(String),
        });
    });

    it.each([
        ['the custom cluster', '3'],
        ['an unknown cluster', '999'],
        ['a malformed param', '01'],
        ['a padded param', ' 0 '],
        ['an empty param', ''],
    ])('should refuse %s as the caller’s input', (_reason, value) => {
        expect(resolveServerClusterUrl(value)).toEqual({ kind: 'refused' });
    });

    it('should name a cluster it serves with no endpoint set as ours to fix', () => {
        vi.stubEnv('MAINNET_RPC_URL', '');

        expect(resolveServerClusterUrl('0')).toEqual({ cluster: Cluster.MainnetBeta, kind: 'unconfigured' });
    });
});

describe('serverClusterUrlFromParam', () => {
    it('should map an ok resolution to its URL and anything else to undefined', () => {
        expect(resolveServerClusterUrl('0')).toMatchObject({ kind: 'ok', url: serverClusterUrlFromParam('0') });
        expect(serverClusterUrlFromParam('3')).toBeUndefined();

        vi.stubEnv('MAINNET_RPC_URL', '');
        expect(serverClusterUrlFromParam('0')).toBeUndefined();
    });
});
