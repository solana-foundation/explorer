import { act, renderHook, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

const mockSend = vi.fn();

vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return {
        ...actual,
        createSolanaRpc: vi.fn(() => ({
            getSignatureStatuses: vi.fn(() => ({ send: mockSend })),
        })),
    };
});

const TEST_SIGNATURE = '5UfDuX7hXbPjSUQPBfRBLRYoy4SZJvfP18VpoYz75Y4P6yCWNxbEq1RCfxGvod7U1PArBAkQbE4yLrdaAiZBmGEs';

const NOT_FOUND = { value: [null] };
const FOUND = { value: [{ confirmationStatus: 'finalized', confirmations: null, err: null, slot: 100 }] };

describe('useClusterTransactionSearch', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.clearAllMocks();
        mockSend.mockResolvedValue(NOT_FOUND);
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start in the searching state', async () => {
        // Keep probes pending so the hook stays in "searching"
        mockSend.mockReturnValue(new Promise(() => {}));
        const { useClusterTransactionSearch } = await import('../use-cluster-transaction-search');

        const { result } = renderHook(() => useClusterTransactionSearch(TEST_SIGNATURE, Cluster.MainnetBeta));

        await waitFor(() => expect(result.current.status).toBe('searching'));
        expect(result.current.searchingCluster).toBe(Cluster.Devnet);
    });

    it('should report the cluster where the signature is found', async () => {
        mockSend.mockResolvedValueOnce(FOUND);
        const { useClusterTransactionSearch } = await import('../use-cluster-transaction-search');

        const { result } = renderHook(() => useClusterTransactionSearch(TEST_SIGNATURE, Cluster.Devnet));

        await waitFor(() => expect(result.current.status).toBe('found'));
        // Devnet is the current cluster and excluded, so MainnetBeta is probed first
        expect(result.current.foundCluster).toBe(Cluster.MainnetBeta);
    });

    it('should report not-found after probing every public cluster', async () => {
        const { useClusterTransactionSearch } = await import('../use-cluster-transaction-search');

        const { result } = renderHook(() => useClusterTransactionSearch(TEST_SIGNATURE, Cluster.MainnetBeta));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        await waitFor(() => expect(result.current.status).toBe('not-found'));
        expect(result.current.foundCluster).toBeUndefined();
        expect(result.current.searchingCluster).toBeUndefined();
    });

    it('should exclude the current cluster from the probe list', async () => {
        const { createSolanaRpc } = await import('@solana/kit');
        const { useClusterTransactionSearch } = await import('../use-cluster-transaction-search');

        renderHook(() => useClusterTransactionSearch(TEST_SIGNATURE, Cluster.MainnetBeta));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        // MainnetBeta is current, so only Devnet + Testnet are probed
        expect(vi.mocked(createSolanaRpc)).toHaveBeenCalledTimes(2);
    });

    it('should probe the custom RPC URL when customUrl is present', async () => {
        vi.mocked(useSearchParams).mockReturnValue(
            new URLSearchParams('customUrl=https://my.custom.rpc') as ReturnType<typeof useSearchParams>,
        );
        const { createSolanaRpc } = await import('@solana/kit');
        const { useClusterTransactionSearch } = await import('../use-cluster-transaction-search');

        renderHook(() => useClusterTransactionSearch(TEST_SIGNATURE, Cluster.MainnetBeta));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        expect(vi.mocked(createSolanaRpc)).toHaveBeenCalledWith('https://my.custom.rpc');
    });

    it('should continue probing when a cluster errors', async () => {
        mockSend.mockRejectedValueOnce(new Error('RPC unreachable')).mockResolvedValueOnce(FOUND);
        const { useClusterTransactionSearch } = await import('../use-cluster-transaction-search');

        const { result } = renderHook(() => useClusterTransactionSearch(TEST_SIGNATURE, Cluster.MainnetBeta));

        await waitFor(() => expect(result.current.status).toBe('found'));
        // First probe (Devnet) rejects, second probe (Testnet) resolves as found
        expect(result.current.foundCluster).toBe(Cluster.Testnet);
    });
});
