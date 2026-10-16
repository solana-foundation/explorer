// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Cluster, clusterSelection } from '../../lib/cluster';
import { useCluster } from '../use-cluster';
import { buildExplorerLink, useExplorerLink } from '../use-explorer-link';

// Mock only the useCluster hook, which useExplorerLink reads for the active cluster.
vi.mock('../use-cluster', () => ({
    useCluster: vi.fn(),
}));

const BASE = 'https://explorer.solana.com';

describe('buildExplorerLink', () => {
    describe('cluster query parameter', () => {
        it.each([
            { cluster: Cluster.Devnet, expectedParam: 'cluster=devnet' },
            { cluster: Cluster.Testnet, expectedParam: 'cluster=testnet' },
        ])('should append $expectedParam for $cluster', ({ cluster, expectedParam }) => {
            const result = buildExplorerLink(clusterSelection(cluster), '/tx/abc');
            expect(result).toBe(`${BASE}/tx/abc?${expectedParam}`);
        });

        it('should omit cluster param for MainnetBeta', () => {
            const result = buildExplorerLink({ cluster: Cluster.MainnetBeta }, '/tx/abc');
            expect(result).toBe(`${BASE}/tx/abc`);
        });

        // No case for a Custom cluster with no endpoint: `ClusterSelection` cannot express one, and such
        // a link was never useful — the reader falls back to the default endpoint.

        it('should append cluster=custom and encodes customUrl', () => {
            const result = buildExplorerLink(clusterSelection(Cluster.Custom, 'http://localhost:8899'), '/tx/abc');
            expect(result).toBe(`${BASE}/tx/abc?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`);
        });
    });

    describe('path joining', () => {
        it('should join path without leading slash using a separator', () => {
            const result = buildExplorerLink({ cluster: Cluster.MainnetBeta }, 'tx/abc');
            expect(result).toBe(`${BASE}/tx/abc`);
        });

        it('should return base URL when path is empty', () => {
            const result = buildExplorerLink({ cluster: Cluster.MainnetBeta }, '');
            expect(result).toBe(BASE);
        });

        it('should return base URL with cluster param when path is empty and cluster is non-mainnet', () => {
            const result = buildExplorerLink({ cluster: Cluster.Devnet }, '');
            expect(result).toBe(`${BASE}?cluster=devnet`);
        });
    });

    describe('existing query params in path', () => {
        it('should place cluster param before existing query params', () => {
            const result = buildExplorerLink({ cluster: Cluster.Devnet }, '/inspector?message=abc123');
            expect(result).toBe(`${BASE}/inspector?cluster=devnet&message=abc123`);
        });

        it('should place cluster and customUrl before existing query params', () => {
            const result = buildExplorerLink(
                clusterSelection(Cluster.Custom, 'http://localhost:8899'),
                '/inspector?message=abc',
            );
            expect(result).toBe(`${BASE}/inspector?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899&message=abc`);
        });
    });
});

describe('useExplorerLink', () => {
    it('should follow the selection useCluster reports', () => {
        vi.mocked(useCluster).mockReturnValue({ selection: { cluster: Cluster.MainnetBeta } } as any);

        const { result, rerender } = renderHook(() => useExplorerLink('/address/123'));

        expect(result.current.link).toBe(`${BASE}/address/123`);

        vi.mocked(useCluster).mockReturnValue({ selection: { cluster: Cluster.Testnet } } as any);

        rerender();

        expect(result.current.link).toBe(`${BASE}/address/123?cluster=testnet`);
    });
});
