import { act, renderHook, waitFor } from '@testing-library/react';
import { Cluster, clusterName, clusterSelection, ClusterStatus } from '@utils/cluster';
import { type ReactNode } from 'react';
import { SWRConfig, type SWRConfiguration } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Imported from their own modules because this file mocks the entity barrel.
import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import type { useCluster } from '@/app/entities/cluster/model/use-cluster';
import { Logger } from '@/app/shared/lib/logger';

import { type AgGenesisCertAnswer } from '../../api/fetch-ag-genesis-cert';
import { ERROR_RETRY_COUNT, POLL_INTERVAL_MS, useAlpenglowStatus } from '../use-alpenglow-status';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const TESTNET_URL = 'https://api.testnet.solana.com';

const CERT = { blockId: 'HnvmbDUEbrmuj3mYAA1EKGGzpZRuFRgMRPwtsgGFadmn', slot: 460_012_345n };

type SwrOverrides = SWRConfiguration & { provider?: () => Map<unknown, unknown> };

const mocks = vi.hoisted(() => ({
    cluster: {} as ClusterContext,
    fetchAgGenesisCert: vi.fn(),
}));

// The real return type, not a hand-written stand-in. A weaker stand-in would let the hook read a
// field the provider no longer publishes, and would type the endpoint as an unbranded string.
type ClusterContext = ReturnType<typeof useCluster>;

vi.mock('@entities/cluster', () => ({ useCluster: () => mocks.cluster }));
vi.mock('../../api/fetch-ag-genesis-cert', () => ({ fetchAgGenesisCert: mocks.fetchAgGenesisCert }));

describe('useAlpenglowStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cluster = clusterContext({ connectableUrl: MAINNET_URL });
        // `shouldAdvanceTime` keeps `waitFor` and the fetcher's promises settling while this test
        // controls SWR's polling timer.
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => vi.useRealTimers());

    it('should report loading before the node answers', () => {
        mocks.fetchAgGenesisCert.mockReturnValue(new Promise(() => {}));

        expect(renderStatus().result.current).toEqual({ kind: 'loading' });
    });

    it('should wait rather than ask while a custom URL is still unsettled', () => {
        mocks.cluster = clusterContext({ connectableUrl: undefined });

        expect(renderStatus().result.current).toEqual({ kind: 'loading' });
        expect(mocks.fetchAgGenesisCert).not.toHaveBeenCalled();
    });

    it('should call the endpoint the cluster context provides', async () => {
        answerWith({ kind: 'absent' });

        renderStatus();

        await waitFor(() => expect(mocks.fetchAgGenesisCert).toHaveBeenCalledWith(toConnectableUrl(MAINNET_URL)));
    });

    it('should report a certificate as a completed migration', async () => {
        answerWith({ cert: CERT, kind: 'present' });

        const { result } = renderStatus();

        await waitFor(() => expect(result.current).toEqual({ cert: CERT, kind: 'migrated' }));
    });

    it('should report an absent certificate as pending', async () => {
        answerWith({ kind: 'absent' });

        const { result } = renderStatus();

        await waitFor(() => expect(result.current).toEqual({ kind: 'pending' }));
    });

    it('should report a node without the method as unavailable', async () => {
        answerWith({ kind: 'unsupported' });

        const { result } = renderStatus();

        await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
    });

    it('should report an endpoint that refuses the method as unavailable', async () => {
        answerWith({ kind: 'refused' });

        const { result } = renderStatus();

        await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
    });

    it('should not ask a refusing endpoint again', async () => {
        answerWith({ kind: 'refused' });

        await renderAndSettle({ dedupingInterval: 0, focusThrottleInterval: 0 });
        await advanceBy(POLL_INTERVAL_MS * 3);
        await refocusTab();
        await settle();

        expect(mocks.fetchAgGenesisCert).toHaveBeenCalledTimes(1);
    });

    it('should report a result that is not a certificate as unavailable', async () => {
        answerWith({ kind: 'unreadable' });

        const { result } = renderStatus();

        await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
    });

    it('should report a failed lookup as unavailable', async () => {
        mocks.fetchAgGenesisCert.mockRejectedValue(new Error('node is unhealthy'));

        const { result } = renderStatus({ errorRetryCount: 0 });

        await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
    });

    // An unkeyed fetch would leave the previous cluster's figures on screen through a switch. The
    // endpoint is in the key, so the new cluster starts from nothing.
    it('should not show one cluster answer while another is still loading', async () => {
        answerWith({ cert: CERT, kind: 'present' });
        const { result, rerender } = renderHook(() => useAlpenglowStatus(), { wrapper: swrWrapper() });
        await waitFor(() => expect(result.current.kind).toBe('migrated'));

        mocks.fetchAgGenesisCert.mockReturnValue(new Promise(() => {}));
        mocks.cluster = clusterContext({ cluster: Cluster.Testnet, connectableUrl: TESTNET_URL, url: TESTNET_URL });
        rerender();

        expect(result.current).toEqual({ kind: 'loading' });
    });

    // SWR retries forever when `errorRetryCount` is unset, backing off to ~21 min between tries.
    // An endpoint failing this often will not answer the next attempt either.
    it('should stop retrying a failure that keeps repeating', async () => {
        mocks.fetchAgGenesisCert.mockRejectedValue(new Error('node is unhealthy'));

        const { result } = renderStatus({ dedupingInterval: 0 });
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
        await advanceBy(60_000);

        expect(mocks.fetchAgGenesisCert).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1);
    });

    // SWR reports the last data alongside a new error, and the hook reads data first.
    it('should keep showing pending when a poll fails', async () => {
        mocks.fetchAgGenesisCert.mockResolvedValueOnce({ kind: 'absent' });
        const { result } = renderStatus({ dedupingInterval: 0 });
        await waitFor(() => expect(result.current.kind).toBe('pending'));

        mocks.fetchAgGenesisCert.mockRejectedValue(new Error('poll failed'));
        await advanceBy(POLL_INTERVAL_MS + 1000);

        expect(result.current).toEqual({ kind: 'pending' });
    });

    // A remount reads the cached answer without fetching, so the poll must restart on its own.
    it('should resume polling a pending cluster after a remount', async () => {
        answerWith({ kind: 'absent' });
        // Both mounts share one cache, because otherwise the second mount fetches for that reason
        // alone and this measures nothing about the poll.
        const cache = new Map();
        const session = { dedupingInterval: 0, provider: () => cache };
        const view = renderStatus(session);
        await waitFor(() => expect(view.result.current.kind).toBe('pending'));
        view.unmount();

        const { result } = renderStatus(session);
        await waitFor(() => expect(result.current.kind).toBe('pending'));
        const before = mocks.fetchAgGenesisCert.mock.calls.length;
        await advanceBy(POLL_INTERVAL_MS + 1000);

        expect(mocks.fetchAgGenesisCert.mock.calls.length).toBeGreaterThan(before);
    });

    // This fires once per visitor with no cache in front of it, so it logs to the console.
    it('should log a failed lookup without reporting it to Sentry', async () => {
        mocks.fetchAgGenesisCert.mockRejectedValue(new Error('node is unhealthy'));

        const { result } = renderStatus({ errorRetryCount: 0 });

        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('[alpenglow]'), expect.anything());
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // `refreshInterval` returns 0 for every answer except an absent certificate.
    it('should ask again while the cluster is still waiting for its certificate', async () => {
        answerWith({ kind: 'absent' });

        const { result } = await renderAndSettle();
        await advanceBy(POLL_INTERVAL_MS);

        expect(result.current).toEqual({ kind: 'pending' });
        expect(mocks.fetchAgGenesisCert).toHaveBeenCalledTimes(2);
    });

    it('should stop asking once the cluster has migrated', async () => {
        answerWith({ cert: CERT, kind: 'present' });

        await renderAndSettle();
        await advanceBy(POLL_INTERVAL_MS * 3);

        expect(mocks.fetchAgGenesisCert).toHaveBeenCalledTimes(1);
    });

    // A settled answer cannot change, so focus and reconnect must not refetch.
    it.each([
        ['the cluster has migrated', { cert: CERT, kind: 'present' } as const],
        ['the node does not implement the call', { kind: 'unsupported' } as const],
    ])('should not ask again on refocus once %s', async (_label, answer) => {
        answerWith(answer);

        await renderAndSettle({ dedupingInterval: 0, focusThrottleInterval: 0 });
        await refocusTab();
        await settle();

        expect(mocks.fetchAgGenesisCert).toHaveBeenCalledTimes(1);
    });

    it('should not refetch on reconnect', async () => {
        answerWith({ kind: 'unsupported' });

        await renderAndSettle({ dedupingInterval: 0 });
        await act(async () => window.dispatchEvent(new Event('online')));
        await settle();

        expect(mocks.fetchAgGenesisCert).toHaveBeenCalledTimes(1);
    });
});

async function refocusTab() {
    await act(async () => {
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
    });
}

/** The wait is the assertion: checking straight after the event passes either way. */
async function settle() {
    await act(() => vi.advanceTimersByTimeAsync(50));
}

/** Renders and waits for the first answer, with deduping off so a poll is free to reach the fetcher. */
async function renderAndSettle(overrides: SwrOverrides = { dedupingInterval: 0 }) {
    const view = renderStatus(overrides);
    await waitFor(() => expect(view.result.current.kind).not.toBe('loading'));
    return view;
}

async function advanceBy(ms: number) {
    await act(() => vi.advanceTimersByTimeAsync(ms));
}

function answerWith(answer: AgGenesisCertAnswer) {
    mocks.fetchAgGenesisCert.mockResolvedValue(answer);
}

function renderStatus(overrides: SwrOverrides = {}) {
    return renderHook(() => useAlpenglowStatus(), { wrapper: swrWrapper(overrides) });
}

/** A cache per test, so one test's pending promise cannot satisfy the next. Retries stay fast. */
function swrWrapper(overrides: SwrOverrides = {}) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <SWRConfig value={{ errorRetryInterval: 1, provider: () => new Map(), ...overrides }}>{children}</SWRConfig>
        );
    };
}

function clusterContext({
    cluster = Cluster.MainnetBeta,
    url = MAINNET_URL,
    connectableUrl,
}: {
    cluster?: Cluster;
    url?: string;
    connectableUrl: string | undefined;
}): ClusterContext {
    const selection = clusterSelection(cluster, url);
    return {
        ...selection,
        connectableUrl: connectableUrl === undefined ? undefined : toConnectableUrl(connectableUrl),
        name: clusterName(cluster),
        selection,
        status: ClusterStatus.Connected,
        url,
    };
}
