import { act, renderHook, waitFor } from '@testing-library/react';
import { Cluster, clusterName, clusterSelection, ClusterStatus } from '@utils/cluster';
import { type ReactNode } from 'react';
import { SWRConfig, type SWRConfiguration, useSWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Both from their own modules rather than the entity barrel, which this file mocks.
import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import type { useCluster } from '@/app/entities/cluster/model/use-cluster';
import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { totalStake, useVoteAccounts } from '../vote-accounts';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const DEVNET_URL = 'https://api.devnet.solana.com';

/** Long enough for a retry or a revalidation to land, so its absence is what the count proves. */
const RETRY_SETTLE_MS = 50;

type SwrOverrides = SWRConfiguration & { provider?: () => Map<unknown, unknown> };

const mocks = vi.hoisted(() => ({
    cluster: {} as ClusterContext,
    getRpc: vi.fn(),
    getVoteAccounts: vi.fn(),
}));

// The real return type, not a hand-written stand-in: a stand-in weaker than the context lets the hook
// read a field the provider no longer publishes, and types the endpoint as the plain string the brand
// exists to refuse.
type ClusterContext = ReturnType<typeof useCluster>;

function clusterContext({
    cluster,
    connectableUrl,
    status,
    url,
}: {
    cluster: Cluster;
    connectableUrl: string | undefined;
    status: ClusterStatus;
    url: string;
}): ClusterContext {
    const selection = clusterSelection(cluster, url);
    return {
        ...selection,
        connectableUrl: connectableUrl === undefined ? undefined : toConnectableUrl(connectableUrl),
        name: clusterName(cluster),
        selection,
        status,
        url,
    };
}

/** A connected endpoint the visitor has settled on. */
function connectedTo(cluster: Cluster, url: string) {
    return clusterContext({ cluster, connectableUrl: url, status: ClusterStatus.Connected, url });
}

vi.mock('@entities/cluster', () => ({ getRpc: mocks.getRpc, useCluster: () => mocks.cluster }));

const RESPONSE = {
    current: [{ activatedStake: 10n }, { activatedStake: 20n }],
    delinquent: [{ activatedStake: 3n }],
};

/** Delinquent counts inside active, so the delinquent account is in both figures. */
const STAKE = { active: 33n, delinquent: 3n };

describe('useVoteAccounts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cluster = connectedTo(Cluster.MainnetBeta, MAINNET_URL);
        mocks.getRpc.mockReturnValue({ getVoteAccounts: mocks.getVoteAccounts });
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.resolve(RESPONSE) });
    });

    // The deadline test below spies on a global; left in place it would outlive this file.
    afterEach(() => vi.restoreAllMocks());

    it('should ask nothing while the health check is still connecting', () => {
        mocks.cluster = { ...connectedTo(Cluster.MainnetBeta, MAINNET_URL), status: ClusterStatus.Connecting };

        const { result } = renderVoteAccounts();

        expect(result.current).toEqual({ kind: 'loading' });
        expect(mocks.getRpc).not.toHaveBeenCalled();
    });

    it('should report the activated stake of current and delinquent accounts', async () => {
        const { result } = renderVoteAccounts();

        await waitFor(() => expect(result.current).toEqual({ kind: 'ready', stake: STAKE }));
        expect(mocks.getVoteAccounts).toHaveBeenCalledWith({ commitment: 'confirmed' });
    });

    it('should report a failure, so a consumer can tell "not coming" from "on its way"', async () => {
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderVoteAccounts();

        await waitFor(() => expect(result.current.kind).toBe('failed'));
    });

    // No server sees this one, so nobody hears about it unless we say so.
    it('should report a failure, which no route logged for it', async () => {
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderVoteAccounts();
        await waitFor(() => expect(result.current.kind).toBe('failed'));

        // Under `sentryExtras`, because this fires from the browser: console output is suppressed there,
        // and context outside `sentryExtras` never reaches Sentry, so a plain field goes nowhere at all.
        expect(Logger.warn).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ cluster: Cluster.MainnetBeta, rpcError: 'rpc down' }),
            }),
        );
    });

    // One slow cluster must not be able to set the *error* rate: this fires from the browser, once per
    // visitor, with no CDN in front of it and no rate limit behind it.
    it('should report at warning level, not error level', async () => {
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderVoteAccounts();
        await waitFor(() => expect(result.current.kind).toBe('failed'));

        expect(Logger.error).not.toHaveBeenCalled();
    });

    // The value, not just the presence: a signal is a signal at any duration, and one long enough is the
    // same as none to a visitor watching the card.
    it('should bound the wait, so a node that never answers does not leave the card spinning', async () => {
        const send = vi.fn(() => Promise.resolve(RESPONSE));
        mocks.getVoteAccounts.mockReturnValue({ send });
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        const { result } = renderVoteAccounts();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(send).toHaveBeenCalledWith({ abortSignal: expect.any(AbortSignal) });
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });

    it('should keep a custom endpoint out of Sentry, whose URL can carry the visitor key', async () => {
        mocks.cluster = connectedTo(Cluster.Custom, 'https://my-node.test?api-key=secret');
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderVoteAccounts();
        await waitFor(() => expect(result.current.kind).toBe('failed'));

        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should still ask on a failed connection, so the retry has something to revalidate', async () => {
        mocks.cluster = { ...connectedTo(Cluster.MainnetBeta, MAINNET_URL), status: ClusterStatus.Failure };
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderVoteAccounts();

        await waitFor(() => expect(result.current.kind).toBe('failed'));
        expect(mocks.getRpc).toHaveBeenCalledWith(MAINNET_URL);
    });

    // `Connected` cannot really happen here, and that is the point: the unsettled endpoint has to be
    // what stops the request, not the health-check gate doing it by accident.
    it('should ask nothing until the endpoint is one the visitor agreed to', () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.Custom,
            connectableUrl: undefined,
            status: ClusterStatus.Connected,
            url: 'http://localhost:8899',
        });

        const { result } = renderVoteAccounts();

        expect(result.current).toEqual({ kind: 'loading' });
        expect(mocks.getRpc).not.toHaveBeenCalled();
    });

    it('should drop the previous cluster figures when the cluster changes', async () => {
        const { rerender, result } = renderVoteAccounts();
        await waitFor(() => expect(result.current.kind).toBe('ready'));

        // The next cluster never answers, so anything carried over would surface here.
        mocks.getVoteAccounts.mockReturnValue({ send: () => new Promise(() => {}) });
        mocks.cluster = connectedTo(Cluster.Devnet, DEVNET_URL);
        rerender();

        expect(result.current).toEqual({ kind: 'loading' });
        await waitFor(() => expect(mocks.getRpc).toHaveBeenCalledWith(DEVNET_URL));
    });

    // The same cluster repointed at a local validator: the cluster half of the key does not move, so only
    // the endpoint half can tell the two requests apart.
    it('should ask again when only the endpoint changes', async () => {
        const { rerender, result } = renderVoteAccounts();
        await waitFor(() => expect(result.current.kind).toBe('ready'));

        mocks.cluster = connectedTo(Cluster.MainnetBeta, 'http://localhost:8899');
        rerender();

        await waitFor(() => expect(mocks.getRpc).toHaveBeenCalledWith('http://localhost:8899'));
    });

    it('should keep figures already in hand when a revalidation fails', async () => {
        // A failed revalidation arrives alongside the data already held.
        const { result } = renderVoteAccountsWithRevalidate();
        await waitFor(() => expect(result.current.state.kind).toBe('ready'));

        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });
        await act(async () => {
            await result.current.revalidate(['vote-accounts', Cluster.MainnetBeta, MAINNET_URL]);
        });

        // The key is written out here, so it has to be checked: `mutate` on one the hook does not use is
        // a no-op, and the assertion below would then hold because nothing ever failed.
        expect(mocks.getVoteAccounts).toHaveBeenCalledTimes(2);
        expect(result.current.state).toEqual({ kind: 'ready', stake: STAKE });
    });

    it('should ask again when the visitor retries a failure', async () => {
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderVoteAccounts();
        await waitFor(() => expect(result.current.kind).toBe('failed'));

        const state = result.current;
        if (state.kind !== 'failed') throw new Error(`expected a failed state, got ${state.kind}`);
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.resolve(RESPONSE) });
        await act(async () => state.retry());

        await waitFor(() => expect(result.current).toEqual({ kind: 'ready', stake: STAKE }));
    });

    // The heaviest call here, always straight at the node with no CDN and no rate limit in front of it.
    // The three tests below are the whole reason the retry above is the visitor's to press.
    it('should not retry a failure on its own, so a down node is not hammered', async () => {
        mocks.getVoteAccounts.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderVoteAccounts();
        await waitFor(() => expect(result.current.kind).toBe('failed'));
        // The wait is the assertion: counting straight after the failure passes either way.
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(mocks.getVoteAccounts).toHaveBeenCalledTimes(1);
    });

    it('should not ask again when the tab regains focus', async () => {
        const { result } = renderVoteAccounts(UNTHROTTLED_FOCUS);
        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(mocks.getVoteAccounts).toHaveBeenCalledTimes(1);

        await act(async () => {
            window.dispatchEvent(new Event('focus'));
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(mocks.getVoteAccounts).toHaveBeenCalledTimes(1);
    });

    it('should not ask again when the page is revisited inside one session', async () => {
        // One Map across both mounts, and no deduping, so only staleness could hold the second request.
        const cache = new Map();
        const sharedCache: SwrOverrides = { dedupingInterval: 0, provider: () => cache };

        const { result: firstVisit, unmount } = renderVoteAccounts(sharedCache);
        await waitFor(() => expect(firstVisit.current.kind).toBe('ready'));
        unmount();

        const { result } = renderVoteAccounts(sharedCache);
        await waitFor(() => expect(result.current.kind).toBe('ready'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(mocks.getVoteAccounts).toHaveBeenCalledTimes(1);
    });
});

describe('totalStake', () => {
    it('should count delinquent stake inside the active total', () => {
        expect(totalStake(RESPONSE)).toEqual(STAKE);
    });

    // The common case on a healthy cluster, and reporting it as missing would hide the row instead.
    it('should report zero delinquent stake rather than no stake at all', () => {
        expect(totalStake({ current: [{ activatedStake: 10n }], delinquent: [] })).toEqual({
            active: 10n,
            delinquent: 0n,
        });
    });

    it('should report a zero active stake on a cluster with no activated stake', () => {
        expect(totalStake({ current: [], delinquent: [] })).toEqual({ active: 0n, delinquent: 0n });
    });
});

function renderVoteAccounts(overrides: SwrOverrides = {}) {
    return renderHook(() => useVoteAccounts(), { wrapper: swrWrapper(overrides) });
}

/** A handle on `mutate`, to force a revalidation the hook does not expose. */
function renderVoteAccountsWithRevalidate() {
    return renderHook(() => ({ revalidate: useSWRConfig().mutate, state: useVoteAccounts() }), {
        wrapper: swrWrapper(),
    });
}

/**
 * A cache per test, so one test's pending promise cannot satisfy the next. `errorRetryInterval` is what
 * makes the counting tests above mean anything: on the default a retry lands long after they finish, so
 * they would pass whether or not retrying is off.
 */
function swrWrapper(overrides: SwrOverrides = {}) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <SWRConfig value={{ errorRetryInterval: 1, provider: () => new Map(), ...overrides }}>{children}</SWRConfig>
        );
    };
}

/** Both throttles off, so a request following a focus is the config's doing and not a coincidence. */
const UNTHROTTLED_FOCUS: SwrOverrides = { dedupingInterval: 0, focusThrottleInterval: 0 };
