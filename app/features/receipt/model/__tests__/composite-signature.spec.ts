import { describe, expect, it } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { buildCompositeSignature, parseCompositeSignature } from '../composite-signature';

const SIG = '5yKzCuw1e9d58HcnzSL31cczfXUux2H4Ga5TAR2RcQLE5W8BiTAC9x9MvhLtc4h99sC9XxLEAjhrXyfKezdMkZFV';

describe('parseCompositeSignature', () => {
    it.each([
        { expected: { signature: SIG }, input: SIG, name: 'signature only' },
        { expected: { signature: SIG, version: '1' }, input: `${SIG}-1`, name: 'signature with version' },
        {
            expected: { cluster: Cluster.Devnet, signature: SIG, version: '1' },
            input: `${SIG}-1-2`,
            name: 'signature with version and cluster',
        },
        {
            expected: { cluster: Cluster.Devnet, signature: SIG, version: '' },
            input: `${SIG}--2`,
            name: 'empty version with cluster',
        },
        {
            expected: { cluster: undefined, signature: SIG, version: '1' },
            input: `${SIG}-1-999`,
            name: 'invalid clusterId',
        },
    ])('should parse $name', ({ input, expected }) => {
        expect(parseCompositeSignature(input)).toEqual(expected);
    });
});

describe('parseCompositeSignature - version independence', () => {
    it('should extract same signature and cluster regardless of version', () => {
        const versions = [`${SIG}-1-2`, `${SIG}-2-2`, `${SIG}-99-2`, `${SIG}--2`];

        const results = versions.map(parseCompositeSignature);

        // All should have same signature and cluster
        results.forEach(result => {
            expect(result.signature).toBe(SIG);
            expect(result.cluster).toBe(Cluster.Devnet);
        });
    });
});

describe('buildCompositeSignature', () => {
    it.each([
        {
            cluster: Cluster.MainnetBeta,
            expected: SIG,
            name: 'mainnet without version',
            signature: SIG,
            version: undefined,
        },
        {
            cluster: Cluster.MainnetBeta,
            expected: `${SIG}-1`,
            name: 'mainnet with version',
            signature: SIG,
            version: '1',
        },
        { cluster: Cluster.Devnet, expected: `${SIG}-1-2`, name: 'devnet with version', signature: SIG, version: '1' },
        {
            cluster: Cluster.Devnet,
            expected: `${SIG}--2`,
            name: 'devnet without version',
            signature: SIG,
            version: undefined,
        },
        { cluster: undefined, expected: SIG, name: 'no version and no cluster', signature: SIG, version: undefined },
    ])('should build $name', ({ signature, version, cluster, expected }) => {
        expect(buildCompositeSignature(signature, version, cluster)).toBe(expected);
    });
});
