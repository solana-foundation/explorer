import { Cluster, DEFAULT_CLUSTER } from '@utils/cluster';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { describe, expect, it } from 'vitest';

import { parseQuery } from '../cluster';

function makeSearchParams(params: Record<string, string> = {}): ReadonlyURLSearchParams {
    return new URLSearchParams(params) as ReadonlyURLSearchParams;
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
