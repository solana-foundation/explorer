import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@solana/kit', () => ({ createSolanaRpc: vi.fn() }));

import { createSolanaRpc } from '@solana/kit';

import { Cluster, ClusterStatus, MAINNET_BETA_URL } from '../../lib/cluster';
import { type ClusterState, StateContext } from '../cluster-provider';
import { useClusterInfo } from '../use-cluster-info';

const EPOCH_INFO = { absoluteSlot: 100n, blockHeight: 90n, epoch: 5n, slotIndex: 10n, slotsInEpoch: 432_000n };
const EPOCH_SCHEDULE = {
    firstNormalEpoch: 0n,
    firstNormalSlot: 0n,
    leaderScheduleSlotOffset: 432_000n,
    slotsPerEpoch: 432_000n,
    warmup: false,
};
const FIRST_BLOCK = 42n;
const EXPECTED_INFO = { epochInfo: EPOCH_INFO, epochSchedule: EPOCH_SCHEDULE, firstAvailableBlock: FIRST_BLOCK };

function mockRpc() {
    return {
        getEpochInfo: vi.fn().mockReturnValue({ send: () => Promise.resolve(EPOCH_INFO) }),
        getEpochSchedule: vi.fn().mockReturnValue({ send: () => Promise.resolve(EPOCH_SCHEDULE) }),
        getFirstAvailableBlock: vi.fn().mockReturnValue({ send: () => Promise.resolve(FIRST_BLOCK) }),
        getGenesisHash: vi.fn().mockReturnValue({ send: () => Promise.resolve('hash') }),
    };
}

let rpc: ReturnType<typeof mockRpc>;

const connectedState: ClusterState = {
    cluster: Cluster.MainnetBeta,
    customUrl: MAINNET_BETA_URL,
    status: ClusterStatus.Connected,
};

function makeWrapper(state: ClusterState) {
    return function Wrapper({ children }: { children: ReactNode }) {
        // Fresh cache per render so SWR entries don't leak across tests.
        return createElement(
            SWRConfig,
            { value: { dedupingInterval: 0, provider: () => new Map() } },
            createElement(StateContext.Provider, { value: state }, children),
        );
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    rpc = mockRpc();
    vi.mocked(createSolanaRpc).mockReturnValue(rpc as unknown as ReturnType<typeof createSolanaRpc>);
});

describe('useClusterInfo', () => {
    it('should fetch the epoch trio when connected, without the getGenesisHash health check', async () => {
        const { result } = renderHook(() => useClusterInfo(), { wrapper: makeWrapper(connectedState) });

        await waitFor(() => expect(result.current).toEqual(EXPECTED_INFO));
        expect(rpc.getFirstAvailableBlock).toHaveBeenCalledTimes(1);
        expect(rpc.getEpochSchedule).toHaveBeenCalledTimes(1);
        expect(rpc.getEpochInfo).toHaveBeenCalledTimes(1);
        // getGenesisHash is the connection health check's job, not this hook's.
        expect(rpc.getGenesisHash).not.toHaveBeenCalled();
    });

    it('should not fetch until the cluster is connected', () => {
        const { result } = renderHook(() => useClusterInfo(), {
            wrapper: makeWrapper({ ...connectedState, status: ClusterStatus.Connecting }),
        });

        expect(result.current).toBeUndefined();
        expect(createSolanaRpc).not.toHaveBeenCalled();
    });

    it('should not fetch when disabled', () => {
        const { result } = renderHook(() => useClusterInfo({ enabled: false }), {
            wrapper: makeWrapper(connectedState),
        });

        expect(result.current).toBeUndefined();
        expect(createSolanaRpc).not.toHaveBeenCalled();
    });
});
