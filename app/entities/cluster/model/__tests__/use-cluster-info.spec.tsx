import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import type { SWRConfiguration } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    FAST_RETRY,
    refocusTab,
    settleRetries,
    swrWrapper,
    UNTHROTTLED_FOCUS,
    waitForHook,
} from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';

vi.mock('../../api/get-rpc', () => ({ getRpc: vi.fn() }));

import { getRpc, type SolanaRpc } from '../../api/get-rpc';
import { Cluster, clusterSelection, ClusterStatus, clusterUrl } from '../../lib/cluster';
import { toConnectableUrl } from '../../lib/connectable-url';
import { type ClusterState, StateContext } from '../cluster-provider';
import { useClusterInfo, useEpochInfo, useEpochSchedule, useFirstAvailableBlock } from '../use-cluster-info';

const EPOCH_INFO = { absoluteSlot: 100n, blockHeight: 90n, epoch: 5n, slotIndex: 10n, slotsInEpoch: 432_000n };
const EPOCH_INFO_LATER = {
    absoluteSlot: 4100n,
    blockHeight: 4000n,
    epoch: 5n,
    slotIndex: 4010n,
    slotsInEpoch: 432_000n,
};
const EPOCH_SCHEDULE = {
    firstNormalEpoch: 0n,
    firstNormalSlot: 0n,
    leaderScheduleSlotOffset: 432_000n,
    slotsPerEpoch: 432_000n,
    warmup: false,
};
const FIRST_BLOCK = 42n;
const EXPECTED_INFO = { epochInfo: EPOCH_INFO, epochSchedule: EPOCH_SCHEDULE };

function mockRpc() {
    return {
        getEpochInfo: vi.fn().mockReturnValue({ send: () => Promise.resolve(EPOCH_INFO) }),
        getEpochSchedule: vi.fn().mockReturnValue({ send: () => Promise.resolve(EPOCH_SCHEDULE) }),
        getFirstAvailableBlock: vi.fn().mockReturnValue({ send: () => Promise.resolve(FIRST_BLOCK) }),
        getGenesisHash: vi.fn().mockReturnValue({ send: () => Promise.resolve('hash') }),
    };
}

let rpc: ReturnType<typeof mockRpc>;

const connectedSelection = clusterSelection(Cluster.MainnetBeta);

const connectedState: ClusterState = {
    connectableUrl: toConnectableUrl(clusterUrl(connectedSelection)),
    selection: connectedSelection,
    status: ClusterStatus.Connected,
};

function makeWrapper(state: ClusterState, config: SWRConfiguration = { dedupingInterval: 0 }) {
    const SwrWrapper = swrWrapper(config);
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(SwrWrapper, null, createElement(StateContext.Provider, { value: state }, children));
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    rpc = mockRpc();
    vi.mocked(getRpc).mockReturnValue(rpc as unknown as SolanaRpc);
});

describe('useEpochSchedule', () => {
    it('should fetch only the schedule', async () => {
        const { result } = renderHook(() => useEpochSchedule(), { wrapper: makeWrapper(connectedState) });

        await waitForHook(() => expect(result.current).toEqual(EPOCH_SCHEDULE));
        expect(rpc.getEpochSchedule).toHaveBeenCalledTimes(1);
        expect(rpc.getEpochInfo).not.toHaveBeenCalled();
        expect(rpc.getFirstAvailableBlock).not.toHaveBeenCalled();
        // getGenesisHash is the connection health check's job, not this hook's.
        expect(rpc.getGenesisHash).not.toHaveBeenCalled();
    });

    it('should not fetch until the cluster is connected', () => {
        const { result } = renderHook(() => useEpochSchedule(), {
            wrapper: makeWrapper({ ...connectedState, status: ClusterStatus.Connecting }),
        });

        expect(result.current).toBeUndefined();
        expect(getRpc).not.toHaveBeenCalled();
    });

    it('should not fetch when disabled', () => {
        const { result } = renderHook(() => useEpochSchedule({ enabled: false }), {
            wrapper: makeWrapper(connectedState),
        });

        expect(result.current).toBeUndefined();
        expect(getRpc).not.toHaveBeenCalled();
    });

    it('should not refetch on tab focus', async () => {
        const { result } = renderHook(() => useEpochSchedule(), {
            wrapper: makeWrapper(connectedState, UNTHROTTLED_FOCUS),
        });

        await waitForHook(() => expect(result.current).toEqual(EPOCH_SCHEDULE));
        expect(rpc.getEpochSchedule).toHaveBeenCalledTimes(1);

        await refocusTab();
        await settleRetries();
        expect(rpc.getEpochSchedule).toHaveBeenCalledTimes(1);
    });
});

describe('useEpochInfo', () => {
    it('should fetch only the epoch info', async () => {
        const { result } = renderHook(() => useEpochInfo(), { wrapper: makeWrapper(connectedState) });

        await waitForHook(() => expect(result.current).toEqual(EPOCH_INFO));
        expect(rpc.getEpochInfo).toHaveBeenCalledTimes(1);
        expect(rpc.getEpochSchedule).not.toHaveBeenCalled();
        expect(rpc.getFirstAvailableBlock).not.toHaveBeenCalled();
    });

    it('should not fetch when disabled', () => {
        const { result } = renderHook(() => useEpochInfo({ enabled: false }), {
            wrapper: makeWrapper(connectedState),
        });

        expect(result.current).toBeUndefined();
        expect(getRpc).not.toHaveBeenCalled();
    });

    it('should refetch on tab focus', async () => {
        const { result } = renderHook(() => useEpochInfo(), {
            wrapper: makeWrapper(connectedState, UNTHROTTLED_FOCUS),
        });

        await waitForHook(() => expect(result.current).toEqual(EPOCH_INFO));
        expect(rpc.getEpochInfo).toHaveBeenCalledTimes(1);

        await refocusTab();
        await waitForHook(() => expect(rpc.getEpochInfo).toHaveBeenCalledTimes(2));
    });

    it('should refresh a stale cached value on remount', async () => {
        const sharedCache = new Map();
        const wrapper = makeWrapper(connectedState, { dedupingInterval: 0, provider: () => sharedCache });

        const view = renderHook(() => useEpochInfo(), { wrapper });
        await waitForHook(() => expect(view.result.current).toEqual(EPOCH_INFO));
        expect(rpc.getEpochInfo).toHaveBeenCalledTimes(1);
        view.unmount();

        rpc.getEpochInfo.mockReturnValue({ send: () => Promise.resolve(EPOCH_INFO_LATER) });

        const { result } = renderHook(() => useEpochInfo(), { wrapper });
        await waitForHook(() => expect(result.current).toEqual(EPOCH_INFO_LATER));
        expect(rpc.getEpochInfo).toHaveBeenCalledTimes(2);
    });

    it('should log the error when the epoch-info fetch fails', async () => {
        const failure = new Error('rpc unreachable');
        rpc.getEpochInfo.mockReturnValue({ send: () => Promise.reject(failure) });
        const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});

        renderHook(() => useEpochInfo(), {
            wrapper: makeWrapper(connectedState, { dedupingInterval: 0, ...FAST_RETRY }),
        });

        await waitForHook(() => expect(errorSpy).toHaveBeenCalledWith(failure, { query: 'epoch-info' }));

        await settleRetries();
        errorSpy.mockRestore();
    });

    it('should refetch on the refresh interval without a focus event', async () => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
        try {
            rpc.getEpochInfo
                .mockReturnValueOnce({ send: () => Promise.resolve(EPOCH_INFO) })
                .mockReturnValue({ send: () => Promise.resolve(EPOCH_INFO_LATER) });

            const { result } = renderHook(() => useEpochInfo(), { wrapper: makeWrapper(connectedState) });
            await waitForHook(() => expect(result.current).toEqual(EPOCH_INFO));
            expect(rpc.getEpochInfo).toHaveBeenCalledTimes(1);

            await act(() => vi.advanceTimersByTimeAsync(30_000));

            await waitForHook(() => expect(result.current).toEqual(EPOCH_INFO_LATER));
            expect(rpc.getEpochInfo).toHaveBeenCalledTimes(2);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('useFirstAvailableBlock', () => {
    it('should fetch only the first available block', async () => {
        const { result } = renderHook(() => useFirstAvailableBlock(), { wrapper: makeWrapper(connectedState) });

        await waitForHook(() => expect(result.current).toEqual(FIRST_BLOCK));
        expect(rpc.getFirstAvailableBlock).toHaveBeenCalledTimes(1);
        expect(rpc.getEpochSchedule).not.toHaveBeenCalled();
        expect(rpc.getEpochInfo).not.toHaveBeenCalled();
    });

    it('should not fetch when disabled', () => {
        const { result } = renderHook(() => useFirstAvailableBlock({ enabled: false }), {
            wrapper: makeWrapper(connectedState),
        });

        expect(result.current).toBeUndefined();
        expect(getRpc).not.toHaveBeenCalled();
    });
});

describe('useClusterInfo', () => {
    it('should compose both epoch values without fetching the first available block', async () => {
        const { result } = renderHook(() => useClusterInfo(), { wrapper: makeWrapper(connectedState) });

        await waitForHook(() => expect(result.current).toEqual(EXPECTED_INFO));
        expect(rpc.getEpochSchedule).toHaveBeenCalledTimes(1);
        expect(rpc.getEpochInfo).toHaveBeenCalledTimes(1);
        expect(rpc.getFirstAvailableBlock).not.toHaveBeenCalled();
    });

    it('should stay undefined until both epoch values load', async () => {
        rpc.getEpochInfo.mockReturnValue({ send: () => new Promise(() => {}) });

        const { result } = renderHook(() => useClusterInfo(), { wrapper: makeWrapper(connectedState) });

        await waitForHook(() => expect(rpc.getEpochSchedule).toHaveBeenCalledTimes(1));
        expect(result.current).toBeUndefined();
    });

    it('should not fetch until the cluster is connected', () => {
        const { result } = renderHook(() => useClusterInfo(), {
            wrapper: makeWrapper({ ...connectedState, status: ClusterStatus.Connecting }),
        });

        expect(result.current).toBeUndefined();
        expect(getRpc).not.toHaveBeenCalled();
    });
});
