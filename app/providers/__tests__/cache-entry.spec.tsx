import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Cluster, clusterSelection, ClusterStatus, clusterUrl } from '@/app/entities/cluster/lib/cluster';
import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import { type ClusterState, StateContext } from '@/app/entities/cluster/model/cluster-provider';
import { type CacheEntry, FetchStatus } from '@/app/providers/cache';
import { useCacheEntries, useCacheEntry } from '@/app/providers/cache-entry';

vi.mock('@solana/kit', () => ({ createSolanaRpc: vi.fn() }));

describe('useCacheEntry', () => {
    it('should report a missing entry as failed once the connection failed', () => {
        // Every provider gates its fetch on a connected cluster, so a missing entry here is not
        // "pending" — nothing will ever be requested. Callers must reach their FetchFailed branch.
        const { result } = renderHook(() => useCacheEntry(ENTRIES, 'absent'), {
            wrapper: makeWrapper(ClusterStatus.Failure),
        });

        expect(result.current).toEqual({ status: FetchStatus.FetchFailed });
    });

    it('should leave a missing entry undefined while the cluster is healthy', () => {
        for (const status of [ClusterStatus.Connected, ClusterStatus.Connecting]) {
            const { result } = renderHook(() => useCacheEntry(ENTRIES, 'absent'), {
                wrapper: makeWrapper(status),
            });

            expect(result.current).toBeUndefined();
        }
    });

    it('should never overwrite an entry the cache already holds', () => {
        // Stale data beats a synthesized failure: the page keeps showing what it fetched before the
        // endpoint went down.
        const { result } = renderHook(() => useCacheEntry(ENTRIES, 'present'), {
            wrapper: makeWrapper(ClusterStatus.Failure),
        });

        expect(result.current).toBe(FETCHED);
    });

    it('should return undefined for an absent key even on failure', () => {
        // Callers with nothing to look up pass undefined to keep their hook order stable; that is not a
        // request, so it is not a failure either.
        const { result } = renderHook(() => useCacheEntry(ENTRIES, undefined), {
            wrapper: makeWrapper(ClusterStatus.Failure),
        });

        expect(result.current).toBeUndefined();
    });

    it('should hand back a stable object across renders', () => {
        // The entry is a render dep for consumers, so a new object each render would churn their memos.
        const { result, rerender } = renderHook(() => useCacheEntry(ENTRIES, 'absent'), {
            wrapper: makeWrapper(ClusterStatus.Failure),
        });
        const first = result.current;
        rerender();

        expect(result.current).toBe(first);
    });
});

describe('useCacheEntries', () => {
    it('should apply the same rule per key', () => {
        const { result } = renderHook(() => useCacheEntries(ENTRIES, ['present', 'absent']), {
            wrapper: makeWrapper(ClusterStatus.Failure),
        });

        expect(result.current).toEqual([FETCHED, { status: FetchStatus.FetchFailed }]);
    });
});

function makeWrapper(status: ClusterStatus) {
    const selection = clusterSelection(Cluster.MainnetBeta);
    const state: ClusterState = { connectableUrl: toConnectableUrl(clusterUrl(selection)), selection, status };
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(StateContext.Provider, { value: state }, children);
    };
}

const FETCHED: CacheEntry<string> = { data: 'account', status: FetchStatus.Fetched };
const ENTRIES = { present: FETCHED };
