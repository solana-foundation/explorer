import { act, renderHook, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useClusterResourceSearch } from '../use-cluster-resource-search';

const RESOURCE_ID = 'test-resource-id';

vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

describe('useClusterResourceSearch', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.clearAllMocks();
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start in the searching state on the first non-current cluster', async () => {
        // Keep the probe pending so the hook stays in "searching"
        const probe = vi.fn(() => new Promise<boolean>(() => {}));

        const { result } = renderHook(() =>
            useClusterResourceSearch({ currentCluster: Cluster.MainnetBeta, probe, resourceId: RESOURCE_ID }),
        );

        await waitFor(() => expect(result.current.status).toBe('searching'));
        expect(result.current.searchingCluster).toBe(Cluster.Devnet);
    });

    it('should report the cluster where the resource is found', async () => {
        const probe = vi.fn().mockResolvedValueOnce(true);

        const { result } = renderHook(() =>
            useClusterResourceSearch({ currentCluster: Cluster.Devnet, probe, resourceId: RESOURCE_ID }),
        );

        await waitFor(() => expect(result.current.status).toBe('found'));
        // Devnet is the current cluster and excluded, so MainnetBeta is probed first
        expect(result.current.foundCluster).toBe(Cluster.MainnetBeta);
    });

    it('should report not-found after probing every public cluster', async () => {
        const probe = vi.fn().mockResolvedValue(false);

        const { result } = renderHook(() =>
            useClusterResourceSearch({ currentCluster: Cluster.MainnetBeta, probe, resourceId: RESOURCE_ID }),
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        await waitFor(() => expect(result.current.status).toBe('not-found'));
        expect(result.current.foundCluster).toBeUndefined();
        expect(result.current.searchingCluster).toBeUndefined();
    });

    it('should exclude the current cluster from the probe list', async () => {
        const probe = vi.fn().mockResolvedValue(false);

        renderHook(() =>
            useClusterResourceSearch({ currentCluster: Cluster.MainnetBeta, probe, resourceId: RESOURCE_ID }),
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        // MainnetBeta is current, so only Devnet + Testnet are probed
        expect(probe).toHaveBeenCalledTimes(2);
    });

    it('should never probe an endpoint from the query string', async () => {
        // The resource id is whatever the visitor is looking at, and the probe sends it. Probing a
        // link-supplied endpoint would hand that address or signature to whoever wrote the link — and on a
        // pending custom cluster the param is still in the bar, since the prompt needs its subject. Trust
        // is decided once, in `decideCustomUrl`; this hook does not get a second, weaker vote.
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams('cluster=custom&customUrl=https://attacker.example/rpc') as ReturnType<
                typeof useSearchParams
            >,
        );
        const probe = vi.fn().mockResolvedValue(false);

        renderHook(() => useClusterResourceSearch({ currentCluster: Cluster.Custom, probe, resourceId: RESOURCE_ID }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        expect(probe.mock.calls.map(([url]) => url)).not.toContain('https://attacker.example/rpc');
        // The public clusters are still searched, so the card keeps working.
        expect(probe).toHaveBeenCalledTimes(3);
    });

    it('should continue probing when a cluster probe throws', async () => {
        const probe = vi.fn().mockRejectedValueOnce(new Error('RPC unreachable')).mockResolvedValueOnce(true);

        const { result } = renderHook(() =>
            useClusterResourceSearch({ currentCluster: Cluster.MainnetBeta, probe, resourceId: RESOURCE_ID }),
        );

        await waitFor(() => expect(result.current.status).toBe('found'));
        // First probe (Devnet) rejects, second probe (Testnet) resolves as found
        expect(result.current.foundCluster).toBe(Cluster.Testnet);
    });

    it('should report not-found when every cluster probe throws', async () => {
        const probe = vi.fn().mockRejectedValue(new Error('RPC unreachable'));

        const { result } = renderHook(() =>
            useClusterResourceSearch({ currentCluster: Cluster.MainnetBeta, probe, resourceId: RESOURCE_ID }),
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        await waitFor(() => expect(result.current.status).toBe('not-found'));
        expect(result.current.foundCluster).toBeUndefined();
        expect(result.current.searchingCluster).toBeUndefined();
        // Every non-current public cluster was attempted before falling through to not-found
        expect(probe).toHaveBeenCalledTimes(2);
    });
});
