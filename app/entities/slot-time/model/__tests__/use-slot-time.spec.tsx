import { renderHook, waitFor } from '@testing-library/react';
import { Cluster, clusterName, clusterSelection, ClusterStatus } from '@utils/cluster';
import { type ReactNode } from 'react';
import { SWRConfig, type SWRConfiguration } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Both from their own modules rather than the cross-entity barrel, which this file mocks.
import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import type { useCluster } from '@/app/entities/cluster/model/use-cluster';
import { Logger } from '@/app/shared/lib/logger';
import { ROUTE_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { ERROR_RETRY_COUNT, useSlotTime } from '../use-slot-time';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const TESTNET_URL = 'https://api.testnet.solana.com';
const LOCAL_URL = 'http://localhost:8899';
const CUSTOM_URL = 'https://my-node.test';

/** Long enough to cover every backoff step the configured retry interval produces. */
const RETRY_SETTLE_MS = 50;

/** `SWRConfig` takes the cache provider too, which `SWRConfiguration` alone does not name. */
type SwrOverrides = SWRConfiguration & { provider?: () => Map<unknown, unknown> };

const mocks = vi.hoisted(() => ({
    cluster: {} as ClusterContext,
    getRecentPerformanceSamples: vi.fn(),
    getRpc: vi.fn(),
}));

type ClusterContext = ReturnType<typeof useCluster>;

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
        mocks.cluster = clusterContext({ cluster: Cluster.MainnetBeta, connectableUrl: MAINNET_URL, url: MAINNET_URL });
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

        await waitFor(() => expect(result.current).toBe(314));
    });

    it('should ask the route for the active cluster', async () => {
        renderSlotTime();

        await waitFor(() =>
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

        await waitFor(() => expect(timeout).toHaveBeenCalledWith(ROUTE_TIMEOUT_MS));
    });

    it.each([
        ['a custom cluster, which the route refuses to resolve', Cluster.Custom, CUSTOM_URL],
        ['a known cluster pointed at a local validator, which the server cannot reach', Cluster.Devnet, LOCAL_URL],
    ])('should ask the endpoint directly on %s', async (_reason, cluster, url) => {
        mocks.cluster = clusterContext({ cluster, connectableUrl: url, url });

        const { result } = renderSlotTime();

        await waitFor(() => expect(result.current).toBe(200));
        expect(mocks.getRpc).toHaveBeenCalledWith(url);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    // A connection that is accepted and never answered would otherwise leave the countdown absent with
    // nothing waiting on it.
    it('should bound the wait at the visitor’s own node too', async () => {
        mocks.cluster = clusterContext({ cluster: Cluster.Custom, connectableUrl: CUSTOM_URL, url: CUSTOM_URL });
        const send = vi.fn(() => Promise.resolve([{ numSlots: 300n, samplePeriodSecs: 60 }]));
        mocks.getRecentPerformanceSamples.mockReturnValue({ send });
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        const { result } = renderSlotTime();

        await waitFor(() => expect(result.current).toBe(200));
        expect(send).toHaveBeenCalledWith({ abortSignal: expect.any(AbortSignal) });
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });

    // Covers a URL held for consent and one not yet judged alike: both leave `url` on the fallback, so
    // only `connectableUrl` can gate the request.
    it('should ask nothing until the endpoint is one the visitor agreed to', async () => {
        mocks.cluster = clusterContext({ cluster: Cluster.Custom, connectableUrl: undefined, url: LOCAL_URL });

        const { result } = renderSlotTime();

        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));
        expect(result.current).toBeUndefined();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mocks.getRpc).not.toHaveBeenCalled();
    });

    // A caller that renders no duration would otherwise reach the visitor's own node for nothing.
    it('should ask nothing when the caller has deferred the request', async () => {
        mocks.cluster = clusterContext({ cluster: Cluster.Custom, connectableUrl: CUSTOM_URL, url: CUSTOM_URL });

        const { result } = renderHook(() => useSlotTime({ enabled: false }), { wrapper: swrWrapper() });

        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));
        expect(result.current).toBeUndefined();
        expect(mocks.getRpc).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    // One cluster's rate against another's epoch is off by up to a factor of two, which is the whole bug.
    it('should drop the previous cluster rate when the cluster changes', async () => {
        const { rerender, result } = renderSlotTime();
        await waitFor(() => expect(result.current).toBe(314));

        fetchMock.mockReturnValue(new Promise(() => {}));
        mocks.cluster = clusterContext({ cluster: Cluster.Testnet, connectableUrl: TESTNET_URL, url: TESTNET_URL });
        rerender();

        expect(result.current).toBeUndefined();
        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(`/api/slot-time?cluster=${Cluster.Testnet}`, expect.anything()),
        );
    });

    // A known cluster repointed at a local validator keeps the same cluster, so only the endpoint in the
    // key can tell the two requests apart.
    it('should ask again when only the endpoint changes', async () => {
        const { rerender, result } = renderSlotTime();
        await waitFor(() => expect(result.current).toBe(314));

        mocks.cluster = clusterContext({ cluster: Cluster.MainnetBeta, connectableUrl: LOCAL_URL, url: LOCAL_URL });
        rerender();

        await waitFor(() => expect(mocks.getRpc).toHaveBeenCalledWith(LOCAL_URL));
    });

    it.each([
        ['the route fails', () => fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response)],
        [
            'the route answers with a body it cannot trust',
            () => fetchMock.mockResolvedValue(untrustedResponse(() => Promise.resolve({ msPerSlot: 'fast' }))),
        ],
    ])('should report nothing when %s, rather than a rate nothing measured', async (_reason, arrange) => {
        arrange();

        const { result } = renderSlotTime();
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(result.current).toBeUndefined();
    });

    // The route stays quiet about a refusal, because any caller can provoke one. This client sends a
    // single fixed request, so a refusal reaching it means our own bug or a deploy that left it behind —
    // and nothing else anywhere would say so.
    it('should report a refusal the route deliberately did not', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 400 } as Response);

        renderSlotTime();
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

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

    // It will refuse the next attempt identically, and every repeat would report it again.
    it('should not retry a refusal, nor report it more than once', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 400 } as Response);

        renderSlotTime({ dedupingInterval: 0 });
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledTimes(1);
    });

    // The route counted this one answered, so nothing on its side could have said otherwise. The parse
    // failure goes with it: it is what separates an intermediary's reply from a payload the two sides
    // disagree on, and the status is 200 for both.
    it('should report a body the route could not have known was unreadable', async () => {
        fetchMock.mockResolvedValue(untrustedResponse(() => Promise.resolve({ msPerSlot: 'fast' })));

        renderSlotTime();
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

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

    // Asking again cannot change a body's shape. Covers a body that parses but states no rate and one
    // that is not JSON at all: only the second rejects on the way in, and both must land the same way.
    it.each([
        ['a body that states no rate', () => Promise.resolve({ msPerSlot: 'fast' })],
        ['a body that is not JSON at all', () => Promise.reject(new SyntaxError('Unexpected token <'))],
    ])('should not retry %s, nor report it more than once', async (_reason, json) => {
        fetchMock.mockResolvedValue(untrustedResponse(json));

        renderSlotTime({ dedupingInterval: 0 });
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledTimes(1);
    });

    // The route recorded these itself; repeating them per visitor turns one outage into a flood.
    it.each([
        ['a node the route could not reach', 502],
        ['a cluster the route has no endpoint for', 500],
    ])('should not report %s, which the route already logged', async (_reason, status) => {
        fetchMock.mockResolvedValue({ ok: false, status } as Response);

        renderSlotTime();
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // Not the route's own answer: a rate limit comes from whatever stands in front of it and clears on
    // its own. It is nobody's bug, and one throttled region would otherwise report once per visitor.
    it('should retry a rate limit without reporting it', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 429 } as Response);

        const { result } = renderSlotTime();

        await waitFor(() => expect(result.current).toBe(314));
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // A tab may sit open for hours; uncapped, the route is asked forever, once per interval, per tab.
    it('should stop retrying a failure that keeps repeating', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);

        renderSlotTime({ dedupingInterval: 0 });
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1);
    });

    it("should not retry at the visitor's own node", async () => {
        mocks.cluster = clusterContext({ cluster: Cluster.Custom, connectableUrl: CUSTOM_URL, url: CUSTOM_URL });
        mocks.getRecentPerformanceSamples.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderSlotTime({ dedupingInterval: 0 });
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(result.current).toBeUndefined();
        expect(mocks.getRecentPerformanceSamples).toHaveBeenCalledTimes(1);
    });
});

function renderSlotTime(overrides: SwrOverrides = {}) {
    return renderHook(() => useSlotTime(), { wrapper: swrWrapper(overrides) });
}

/** A cache per test, so one test's pending promise cannot satisfy the next. Retries stay fast. */
function swrWrapper(overrides: SwrOverrides = {}) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <SWRConfig value={{ errorRetryInterval: 1, provider: () => new Map(), ...overrides }}>{children}</SWRConfig>
        );
    };
}

// The real return type, not a hand-written stand-in: a weaker one lets the hook read a field the
// provider no longer publishes, and types the endpoint as the plain string the brand exists to refuse.
function clusterContext({
    cluster,
    connectableUrl,
    url,
}: {
    cluster: Cluster;
    connectableUrl: string | undefined;
    url: string;
}): ClusterContext {
    const selection = clusterSelection(cluster, url);
    return {
        ...selection,
        connectableUrl: connectableUrl === undefined ? undefined : toConnectableUrl(connectableUrl),
        name: clusterName(cluster),
        selection,
        // Connecting on purpose: the rate must not wait on the cluster health check.
        status: ClusterStatus.Connecting,
        url,
    };
}

function routeResponse(msPerSlot: number): Response {
    return { json: () => Promise.resolve({ msPerSlot }), ok: true } as Response;
}

/** A 200 whose body the client cannot read, either because it parses to the wrong shape or not at all. */
function untrustedResponse(json: () => Promise<unknown>): Response {
    return { json, ok: true } as Response;
}
