import { renderHook } from '@testing-library/react';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { type SWRConfiguration } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type ClusterContext,
    clusterContext,
    FAST_RETRY,
    settleRetries,
    swrWrapper,
    waitForHook,
} from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';
import { ROUTE_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { ERROR_RETRY_COUNT, useSlotTime } from '../use-slot-time';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const TESTNET_URL = 'https://api.testnet.solana.com';
const LOCAL_URL = 'http://localhost:8899';
const CUSTOM_URL = 'https://my-node.test';

const mocks = vi.hoisted(() => ({
    cluster: {} as ClusterContext,
    getRecentPerformanceSamples: vi.fn(),
    getRpc: vi.fn(),
}));

// `shouldUseDirectRpc` stays real: which endpoint gets asked is the decision under test.
vi.mock('@entities/cluster/@x/slot-time', async () => {
    const { shouldUseDirectRpc } = await vi.importActual<
        typeof import('@/app/entities/cluster/lib/should-use-direct-rpc')
    >('@/app/entities/cluster/lib/should-use-direct-rpc');
    return { getRpc: mocks.getRpc, shouldUseDirectRpc, useCluster: () => mocks.cluster };
});

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('useSlotTime', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cluster = connectingTo(Cluster.MainnetBeta, MAINNET_URL);
        fetchMock.mockResolvedValue(routeResponse(314));
        mocks.getRpc.mockReturnValue({ getRecentPerformanceSamples: mocks.getRecentPerformanceSamples });
        mocks.getRecentPerformanceSamples.mockReturnValue({
            send: () => Promise.resolve([{ numSlots: 300n, samplePeriodSecs: 60 }]),
        });
    });

    it('should report nothing before the request resolves', () => {
        fetchMock.mockReturnValue(new Promise(() => {}));

        expect(renderSlotTime().result.current).toBeUndefined();
    });

    it('should report the rate the route measured', async () => {
        const { result } = renderSlotTime();

        await waitForHook(() => expect(result.current).toBe(314));
    });

    it('should ask the route for the active cluster', async () => {
        renderSlotTime();

        await waitForHook(() =>
            expect(fetchMock).toHaveBeenCalledWith(
                `/api/slot-time?cluster=${Cluster.MainnetBeta}`,
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            ),
        );
    });

    // The value, not just the presence: this deadline has to outlast the route's own, or a cold start
    // turns a classified answer into an abort.
    it('should wait on the route for longer than the route waits on the node', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        renderSlotTime();

        await waitForHook(() => expect(timeout).toHaveBeenCalledWith(ROUTE_TIMEOUT_MS));
    });

    it.each([
        ['a custom cluster, which the route refuses to resolve', Cluster.Custom, CUSTOM_URL],
        ['a known cluster pointed at a local validator, which the server cannot reach', Cluster.Devnet, LOCAL_URL],
    ])('should ask the endpoint directly on %s', async (_reason, cluster, url) => {
        mocks.cluster = connectingTo(cluster, url);

        const { result } = renderSlotTime();

        await waitForHook(() => expect(result.current).toBe(200));
        expect(mocks.getRpc).toHaveBeenCalledWith(url);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    // A connection that is accepted and never answered would otherwise leave the countdown absent with
    // nothing waiting on it.
    it('should bound the wait at the visitor’s own node too', async () => {
        mocks.cluster = connectingTo(Cluster.Custom, CUSTOM_URL);
        const send = vi.fn(() => Promise.resolve([{ numSlots: 300n, samplePeriodSecs: 60 }]));
        mocks.getRecentPerformanceSamples.mockReturnValue({ send });
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        const { result } = renderSlotTime();

        await waitForHook(() => expect(result.current).toBe(200));
        expect(send).toHaveBeenCalledWith({ abortSignal: expect.any(AbortSignal) });
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });

    // Covers a URL held for consent and one not yet judged alike: both leave `url` on the fallback, so
    // only `connectableUrl` can gate the request.
    it('should ask nothing until the endpoint is one the visitor agreed to', async () => {
        mocks.cluster = { ...connectingTo(Cluster.Custom, LOCAL_URL), connectableUrl: undefined };

        const { result } = renderSlotTime();

        await settleRetries();
        expect(result.current).toBeUndefined();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mocks.getRpc).not.toHaveBeenCalled();
    });

    // A caller that renders no duration would otherwise reach the visitor's own node for nothing.
    it('should ask nothing when the caller has deferred the request', async () => {
        mocks.cluster = connectingTo(Cluster.Custom, CUSTOM_URL);

        const { result } = renderHook(() => useSlotTime({ enabled: false }), { wrapper: swrWrapper(FAST_RETRY) });

        await settleRetries();
        expect(result.current).toBeUndefined();
        expect(mocks.getRpc).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    // One cluster's rate against another's epoch is off by up to a factor of two, which is the whole bug.
    it('should drop the previous cluster rate when the cluster changes', async () => {
        const { rerender, result } = renderSlotTime();
        await waitForHook(() => expect(result.current).toBe(314));

        fetchMock.mockReturnValue(new Promise(() => {}));
        mocks.cluster = connectingTo(Cluster.Testnet, TESTNET_URL);
        rerender();

        expect(result.current).toBeUndefined();
        await waitForHook(() =>
            expect(fetchMock).toHaveBeenCalledWith(`/api/slot-time?cluster=${Cluster.Testnet}`, expect.anything()),
        );
    });

    // A known cluster repointed at a local validator keeps the same cluster, so only the endpoint in the
    // key can tell the two requests apart.
    it('should ask again when only the endpoint changes', async () => {
        const { rerender, result } = renderSlotTime();
        await waitForHook(() => expect(result.current).toBe(314));

        mocks.cluster = connectingTo(Cluster.MainnetBeta, LOCAL_URL);
        rerender();

        await waitForHook(() => expect(mocks.getRpc).toHaveBeenCalledWith(LOCAL_URL));
    });

    // The route stays quiet about a refusal, because any caller can provoke one. This client sends a
    // single fixed request, so a refusal reaching it means our own bug or a deploy that left it behind —
    // and nothing else anywhere would say so. It will refuse the next attempt identically.
    it('should report a refusal the route deliberately did not, once and without retrying it', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 400 } as Response);

        renderSlotTime({ dedupingInterval: 0 });
        await settleRetries();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ cluster: Cluster.MainnetBeta, status: 400 }),
            }),
        );
        // The bot gate ahead of the route refuses visitors it misjudges, and this fires once per visitor
        // with no CDN in front of it: one gate misfiring must not set the error rate on its own.
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // The route counted this one answered, so nothing on its side could have said otherwise. The parse
    // failure goes with it: it is what separates an intermediary's reply from a payload the two sides
    // disagree on, and the status is 200 for both.
    //
    // Asking again cannot change a body's shape. Covers a body that parses but states no rate and one
    // that is not JSON at all: only the second rejects on the way in, and both must land the same way.
    it.each([
        ['a body that states no rate', () => Promise.resolve({ msPerSlot: 'fast' })],
        ['a body that is not JSON at all', () => Promise.reject(new SyntaxError('Unexpected token <'))],
    ])('should report nothing for %s, and report it once without retrying', async (_reason, json) => {
        fetchMock.mockResolvedValue(untrustedResponse(json));

        const { result } = renderSlotTime({ dedupingInterval: 0 });
        await settleRetries();

        expect(result.current).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({
                    cluster: Cluster.MainnetBeta,
                    parseError: expect.any(String),
                }),
            }),
        );
        // A captive portal or an interstitial proxy answers for the route this way, once per visitor with
        // no CDN in front of it: someone else's middlebox must not set the error rate.
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // The route recorded these itself; repeating them per visitor turns one outage into a flood.
    it.each([
        ['a node the route could not reach', 502],
        ['a cluster the route has no endpoint for', 500],
    ])('should not report %s, which the route already logged', async (_reason, status) => {
        fetchMock.mockResolvedValue({ ok: false, status } as Response);

        renderSlotTime();
        await settleRetries();

        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // Not the route's own answer: a rate limit comes from whatever stands in front of it and clears on
    // its own. It is nobody's bug, and one throttled region would otherwise report once per visitor.
    it('should retry a rate limit without reporting it', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 429 } as Response);

        const { result } = renderSlotTime();

        await waitForHook(() => expect(result.current).toBe(314));
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // A tab may sit open for hours; uncapped, the route is asked forever, once per interval, per tab.
    it('should stop retrying a failure that keeps repeating, and report nothing rather than a rate nothing measured', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);

        const { result } = renderSlotTime({ dedupingInterval: 0 });
        await settleRetries();

        expect(fetchMock).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1);
        expect(result.current).toBeUndefined();
    });

    it("should not retry at the visitor's own node", async () => {
        mocks.cluster = connectingTo(Cluster.Custom, CUSTOM_URL);
        mocks.getRecentPerformanceSamples.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderSlotTime({ dedupingInterval: 0 });
        await settleRetries();

        expect(result.current).toBeUndefined();
        expect(mocks.getRecentPerformanceSamples).toHaveBeenCalledTimes(1);
    });
});

function renderSlotTime(overrides: SWRConfiguration = {}) {
    return renderHook(() => useSlotTime(), { wrapper: swrWrapper({ ...FAST_RETRY, ...overrides }) });
}

function connectingTo(cluster: Cluster, url: string) {
    // Connecting on purpose: the rate must not wait on the cluster health check.
    return clusterContext({ cluster, connectableUrl: url, status: ClusterStatus.Connecting, url });
}

function routeResponse(msPerSlot: number): Response {
    return { json: () => Promise.resolve({ msPerSlot }), ok: true } as Response;
}

/** A 200 whose body the client cannot read, either because it parses to the wrong shape or not at all. */
function untrustedResponse(json: () => Promise<unknown>): Response {
    return { json, ok: true } as Response;
}
