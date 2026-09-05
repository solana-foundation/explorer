import { describe, expect, it } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { clusterToWalletChain } from '../cluster-chain';

describe('clusterToWalletChain', () => {
    it.each([
        [Cluster.MainnetBeta, 'solana:mainnet'],
        [Cluster.Devnet, 'solana:devnet'],
        [Cluster.Testnet, 'solana:testnet'],
    ])('should map cluster %s to %s', (cluster, expected) => {
        expect(clusterToWalletChain(cluster)).toBe(expected);
    });

    it.each([Cluster.Custom, Cluster.Simd296])(
        'should map cluster %s to localnet, since it points at an arbitrary endpoint',
        cluster => {
            expect(clusterToWalletChain(cluster)).toBe('solana:localnet');
        },
    );
});
