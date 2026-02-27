import { describe, expect, it } from 'vitest';

import { SAVED_CLUSTER_PREFIX } from '@features/custom-cluster';
import { Cluster, DEFAULT_CLUSTER } from '@utils/cluster';

import { parseQuery } from '../cluster';

function makeSearchParams(params: Record<string, string> = {}): URLSearchParams {
    return new URLSearchParams(params);
}

describe('parseQuery', () => {
    it('returns the cluster from URL params when present', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'devnet' }), null)).toBe(Cluster.Devnet);
    });

    it('falls back to persisted cluster when no URL params', () => {
        expect(parseQuery(makeSearchParams(), 'devnet')).toBe(Cluster.Devnet);
    });

    it('returns Custom when persisted value has saved-cluster prefix', () => {
        expect(parseQuery(makeSearchParams(), `${SAVED_CLUSTER_PREFIX}My Local`)).toBe(Cluster.Custom);
    });

    it('returns default cluster when persisted slug is unrecognized', () => {
        expect(parseQuery(makeSearchParams(), 'bogus-cluster')).toBe(DEFAULT_CLUSTER);
    });

    it('returns default cluster when both params and persisted are empty', () => {
        expect(parseQuery(makeSearchParams(), null)).toBe(DEFAULT_CLUSTER);
    });

    it('URL params take precedence over persisted value', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'testnet' }), 'devnet')).toBe(Cluster.Testnet);
    });

    it('returns default cluster for empty cluster param', () => {
        expect(parseQuery(makeSearchParams({ cluster: '' }), null)).toBe(DEFAULT_CLUSTER);
    });
});
