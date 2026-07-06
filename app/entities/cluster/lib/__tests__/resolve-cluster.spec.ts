import { describe, expect, it } from 'vitest';

import { Cluster, DEFAULT_CLUSTER } from '../cluster';
import { isCustomUrlAllowed, parseQuery } from '../resolve-cluster';

function makeSearchParams(params: Record<string, string> = {}): URLSearchParams {
    return new URLSearchParams(params);
}

describe('parseQuery', () => {
    it('should return the cluster from URL params when present', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'devnet' }))).toBe(Cluster.Devnet);
    });

    it('should return default cluster when no params are provided', () => {
        expect(parseQuery(makeSearchParams())).toBe(DEFAULT_CLUSTER);
    });

    it('should return default cluster for empty cluster param', () => {
        expect(parseQuery(makeSearchParams({ cluster: '' }))).toBe(DEFAULT_CLUSTER);
    });

    it('should return default cluster for unrecognized cluster param', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'bogus-cluster' }))).toBe(DEFAULT_CLUSTER);
    });

    it('should return testnet when cluster param is testnet', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'testnet' }))).toBe(Cluster.Testnet);
    });
});

describe('isCustomUrlAllowed', () => {
    const nonCustom = { candidateUrl: 'http://localhost:8899', cluster: Cluster.Devnet, devFlagEnabled: false };

    it('should allow the custom URL on the Custom cluster regardless of the flag', () => {
        expect(isCustomUrlAllowed({ ...nonCustom, cluster: Cluster.Custom })).toBe(true);
    });

    it('should allow the custom URL when the developer flag is enabled', () => {
        expect(isCustomUrlAllowed({ ...nonCustom, devFlagEnabled: true })).toBe(true);
    });

    it('should allow the custom URL when the candidate host is whitelisted', () => {
        expect(isCustomUrlAllowed({ ...nonCustom, candidateUrl: 'https://engine.mirror.ad/rpc' })).toBe(true);
    });

    it('should disallow the custom URL otherwise', () => {
        expect(isCustomUrlAllowed(nonCustom)).toBe(false);
    });
});
