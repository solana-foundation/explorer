import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { Cluster, clusterSelection, ClusterStatus } from '../../lib/cluster';
import { type ClusterState, StateContext } from '../cluster-provider';
import { useClusterConnectionFailed } from '../use-cluster-connection-failed';

describe('useClusterConnectionFailed', () => {
    it('should report a failed connection', () => {
        const { result } = renderHook(() => useClusterConnectionFailed(), {
            wrapper: makeWrapper(ClusterStatus.Failure),
        });

        expect(result.current).toBe(true);
    });

    it('should not report a failed connection once connected', () => {
        const { result } = renderHook(() => useClusterConnectionFailed(), {
            wrapper: makeWrapper(ClusterStatus.Connected),
        });

        expect(result.current).toBe(false);
    });

    // Connecting covers the pending-consent state too, where nothing has been asked of the endpoint
    // yet. A page must keep loading there, not claim the endpoint is down.
    it('should not report a failed connection while connecting', () => {
        const { result } = renderHook(() => useClusterConnectionFailed(), {
            wrapper: makeWrapper(ClusterStatus.Connecting),
        });

        expect(result.current).toBe(false);
    });
});

function makeWrapper(status: ClusterStatus) {
    const state: ClusterState = { selection: clusterSelection(Cluster.MainnetBeta), status };
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(StateContext.Provider, { value: state }, children);
    };
}
