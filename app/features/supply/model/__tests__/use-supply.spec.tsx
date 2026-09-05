import { act, renderHook, waitFor } from '@testing-library/react';
import { Cluster, clusterName, clusterSelection, ClusterStatus } from '@utils/cluster';
import { type ReactNode } from 'react';
import { SWRConfig, type SWRConfiguration, useSWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Both from their own modules rather than the entity barrel, which this file mocks.
import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import type { useCluster } from '@/app/entities/cluster/model/use-cluster';
import { Logger } from '@/app/shared/lib/logger';
import { ROUTE_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { ERROR_RETRY_COUNT, useSupply } from '../use-supply';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const DEVNET_URL = 'https://api.devnet.solana.com';
const LOCAL_URL = 'http://localhost:8899';

/** Long enough to cover every backoff step the configured retry interval produces. */
const RETRY_SETTLE_MS = 50;

/** `SWRConfig` takes the cache provider too, which `SWRConfiguration` alone does not name. */
type SwrOverrides = SWRConfiguration & { provider?: () => Map<unknown, unknown> };

const mocks = vi.hoisted(() => ({
    cluster: {} as ClusterContext,
    getRpc: vi.fn(),
    getSupply: vi.fn(),
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

// `shouldUseDirectRpc` stays real: which endpoint gets asked is the decision under test.
vi.mock('@entities/cluster', async () => {
    const { shouldUseDirectRpc } = await vi.importActual<
        typeof import('@/app/entities/cluster/lib/should-use-direct-rpc')
    >('@/app/entities/cluster/lib/should-use-direct-rpc');
    return { getRpc: mocks.getRpc, shouldUseDirectRpc, useCluster: () => mocks.cluster };
});
// No local logger mock: the global setup already covers every method, a narrower one would not.

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('useSupply', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cluster = clusterContext({
            cluster: Cluster.MainnetBeta,
            connectableUrl: MAINNET_URL,
            // Connecting on purpose: supply must not wait on the health check.
            status: ClusterStatus.Connecting,
            url: MAINNET_URL,
        });
        fetchMock.mockResolvedValue(supplyResponse());
        mocks.getRpc.mockReturnValue({ getSupply: mocks.getSupply });
        mocks.getSupply.mockReturnValue({ send: () => Promise.resolve({ value: rpcSupply() }) });
    });

    // The deadline tests below spy on a global; left in place it would outlive this file.
    afterEach(() => vi.restoreAllMocks());

    it('should report loading before the request resolves', () => {
        fetchMock.mockReturnValue(new Promise(() => {}));

        expect(renderSupply().result.current).toEqual({ kind: 'loading' });
    });

    it('should ask the route while the cluster health check is still connecting', async () => {
        renderSupply();

        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(
                `/api/supply?cluster=${Cluster.MainnetBeta}`,
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            ),
        );
    });

    // The check failing is where the route earns its keep: the node is unreachable for a genesis hash and
    // the cache can still answer. Gating on status at all would turn that into a dead card.
    it('should ask the route when the cluster health check has failed', async () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.MainnetBeta,
            connectableUrl: MAINNET_URL,
            status: ClusterStatus.Failure,
            url: MAINNET_URL,
        });

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(fetchMock).toHaveBeenCalledWith(`/api/supply?cluster=${Cluster.MainnetBeta}`, expect.anything());
    });

    // The value, not just the presence: this deadline has to outlast the route's own, or a cold start
    // turns an answer the route classified into an abort that reads as retryable and is recorded nowhere.
    it('should wait on the route for longer than the route waits on the node', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        renderSupply();

        await waitFor(() => expect(timeout).toHaveBeenCalledWith(ROUTE_TIMEOUT_MS));
    });

    // A connection that is accepted and never answered would otherwise leave the card spinning for good:
    // no error, no retry button, and nothing recorded anywhere.
    it('should bound the wait at the visitor’s own node too', async () => {
        mocks.cluster = customCluster();
        const send = vi.fn(() => Promise.resolve({ value: rpcSupply() }));
        mocks.getSupply.mockReturnValue({ send });
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(send).toHaveBeenCalledWith({ abortSignal: expect.any(AbortSignal) });
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });

    it('should report the supply once the route answers', async () => {
        const { result } = renderSupply();

        await waitFor(() =>
            expect(result.current).toEqual({
                kind: 'ready',
                supply: { circulating: 1n, total: 3n },
            }),
        );
    });

    it('should ask the endpoint directly on a custom cluster, which the route refuses to resolve', async () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.Custom,
            connectableUrl: 'https://my-node.test',
            status: ClusterStatus.Connected,
            url: 'https://my-node.test',
        });

        const { result } = renderSupply();

        // The whole figure, not just the state: this path skips `parseSupplyPayload`, so nothing else
        // would notice the two counts being read out of the wrong fields.
        await waitFor(() => expect(result.current).toEqual({ kind: 'ready', supply: { circulating: 1n, total: 3n } }));
        expect(mocks.getRpc).toHaveBeenCalledWith('https://my-node.test');
        expect(fetchMock).not.toHaveBeenCalled();
        // Dropping the flag here would put the whole account list on the wire, in the browser.
        expect(mocks.getSupply).toHaveBeenCalledWith({
            commitment: 'finalized',
            excludeNonCirculatingAccountsList: true,
        });
    });

    it('should ask directly on a known cluster pointed at a local validator, which the server cannot reach', async () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.Devnet,
            connectableUrl: 'http://localhost:8899',
            status: ClusterStatus.Connected,
            url: 'http://localhost:8899',
        });

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(mocks.getRpc).toHaveBeenCalledWith('http://localhost:8899');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    // Covers a URL held for consent and one not yet judged alike: both leave `url` on the fallback, so
    // only `connectableUrl` can gate the request.
    it('should ask nothing until the endpoint is one the visitor agreed to', async () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.Custom,
            connectableUrl: undefined,
            status: ClusterStatus.Connecting,
            url: 'http://localhost:8899',
        });

        const { result } = renderSupply();

        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));
        expect(result.current).toEqual({ kind: 'loading' });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mocks.getRpc).not.toHaveBeenCalled();
    });

    it('should drop the previous cluster figure when the cluster changes', async () => {
        const { rerender, result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('ready'));

        // The next cluster never answers, so a figure carried over would surface here — one cluster's
        // supply beside another's stake is the mismatch this key exists to prevent.
        fetchMock.mockReturnValue(new Promise(() => {}));
        mocks.cluster = clusterContext({
            cluster: Cluster.Devnet,
            connectableUrl: DEVNET_URL,
            status: ClusterStatus.Connected,
            url: DEVNET_URL,
        });
        rerender();

        expect(result.current).toEqual({ kind: 'loading' });
        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(`/api/supply?cluster=${Cluster.Devnet}`, expect.anything()),
        );
    });

    // A known cluster repointed at a local validator keeps the same cluster, so only the endpoint in the
    // key can tell the two requests apart.
    it('should ask again when only the endpoint changes', async () => {
        const { rerender, result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('ready'));

        mocks.cluster = clusterContext({
            cluster: Cluster.MainnetBeta,
            connectableUrl: LOCAL_URL,
            status: ClusterStatus.Connecting,
            url: LOCAL_URL,
        });
        rerender();

        await waitFor(() => expect(mocks.getRpc).toHaveBeenCalledWith(LOCAL_URL));
    });

    it('should report a failure when the route fails', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 502 } as Response);

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
    });

    // The server already logged it; repeating it per visitor turns one outage into a flood. Both levels
    // asserted, because the gate that holds this back is the status test and not the retryable one — drop
    // the status half and every `5xx` starts warning from every browser instead.
    it.each([
        ['a node the route could not reach', 502],
        ['a cluster the route has no endpoint for', 500],
    ])('should not report %s, which the route already logged', async (_reason, status) => {
        fetchMock.mockResolvedValue({ ok: false, status } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(Logger.error).not.toHaveBeenCalled();
        expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should retry an upstream failure on its own, since the next attempt can answer differently', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 503 } as Response);

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // The other half of the route's transient tier. A node that was slow once may answer the next call.
    it('should retry a deadline the route reported', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 504 } as Response);

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // The route answers 502 for a call the node refuses to serve: someone has to change configuration
    // first, so every retry after that is another request for the same refusal.
    it('should not retry a call the node refuses to serve', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 502 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // A separate state, not a `failed` missing its retry: the card picks its message off `kind`, so a
    // failure that carries no retry cannot be mistaken for one whose retry went missing.
    it('should report an answer no retry can change as unavailable', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 502 } as Response);

        const { result } = renderSupply();

        await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
    });

    // The route answers 500 for a cluster it serves with no endpoint set. That waits on someone setting
    // one, so a retry here would only re-ask for the same answer and hand the visitor a dead button.
    it('should not retry, nor offer a retry for, a cluster with no endpoint configured', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should offer a retry where the next attempt could answer differently', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('failed'));

        expect(result.current).toEqual({ kind: 'failed', retry: expect.any(Function) });
    });

    // Unclassified, so most likely the connection rather than the answer.
    it('should retry a request that never reached the route', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // It will refuse the next attempt identically.
    it('should not retry a cluster the route refuses', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 400 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // The route stays quiet about a refusal, because any caller can provoke one. This caller sends a
    // single fixed request, so a refusal reaching it means our own bug or a deploy that left it behind —
    // and nothing else anywhere would say so.
    it('should report a refusal the route deliberately did not', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 400 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));

        expect(Logger.warn).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ cluster: Cluster.MainnetBeta, status: 400 }),
            }),
        );
    });

    // The bot gate ahead of the route refuses a visitor it misjudges, and this fires once per visitor with
    // no CDN in front of it. Either way round, one gate misfiring must not set the error rate on its own.
    it('should not raise the error rate on a refusal it cannot attribute', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 401 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));

        expect(Logger.error).not.toHaveBeenCalled();
    });

    // Not the route's own answer: a rate limit comes from whatever stands in front of it, and it clears on
    // its own. Read as permanent it would hand the visitor a dead card until they reloaded the page.
    it('should retry a rate limit and offer a retry for it', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 429 } as Response);

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // Nobody's bug, and one throttled region would otherwise report once per visitor.
    it('should not report a rate limit', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 429 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('failed'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // A body cut short is the connection giving out, not the route disagreeing, so it is worth another go
    // and worth nobody's attention.
    it('should retry a truncated body without reporting it', async () => {
        fetchMock.mockResolvedValueOnce({
            json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
            ok: true,
        } as unknown as Response);

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should report a failure when the route answers with a body it cannot trust', async () => {
        fetchMock.mockResolvedValue({ json: () => Promise.resolve({ circulating: 'lots' }), ok: true } as Response);

        const { result } = renderSupply();

        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
    });

    // The only failure the server cannot see, so the only one worth reporting from here.
    it('should report a body it cannot trust, which the route answered 200 for', async () => {
        fetchMock.mockResolvedValue({ json: () => Promise.resolve({ circulating: 'lots' }), ok: true } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));

        expect(Logger.error).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ cluster: Cluster.MainnetBeta }),
            }),
        );
    });

    // It answered once and will answer the same way, so retrying just repeats the report.
    it('should not retry a body it cannot read, nor report it more than once', async () => {
        fetchMock.mockResolvedValue({ json: () => Promise.resolve({ circulating: 'lots' }), ok: true } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('unavailable'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(Logger.error).toHaveBeenCalledTimes(1);
    });

    it("should not retry at the visitor's own node, where each attempt is another scan", async () => {
        mocks.cluster = customCluster();
        mocks.getSupply.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('failed'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(mocks.getSupply).toHaveBeenCalledTimes(1);
        // That endpoint is the visitor's own, and its URL can carry their key.
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // A local validator on a known cluster: no route saw the request, so this is the only place it can be
    // recorded, and the endpoint is not the visitor's private business the way a custom one is.
    it('should report a direct failure on a known cluster', async () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.Devnet,
            connectableUrl: LOCAL_URL,
            status: ClusterStatus.Connected,
            url: LOCAL_URL,
        });
        mocks.getSupply.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('failed'));

        expect(Logger.error).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ cluster: Cluster.Devnet }),
            }),
        );
    });

    it('should keep supply already in hand when a revalidation fails', async () => {
        // SWR reports a failed revalidation alongside the data it already holds.
        const { result } = renderSupplyWithRevalidate();
        await waitFor(() => expect(result.current.state.kind).toBe('ready'));

        fetchMock.mockResolvedValue({ ok: false, status: 502 } as Response);
        await act(async () => {
            await result.current.revalidate(['supply', Cluster.MainnetBeta, MAINNET_URL]);
        });

        // The key is written out here, so it has to be checked: `mutate` on one the hook does not use is
        // a no-op, and the assertion below would then hold because nothing ever failed.
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result.current.state).toEqual({ kind: 'ready', supply: { circulating: 1n, total: 3n } });
    });

    // Nothing caches a ledger scan at someone's own node, so the defaults would repeat it per tab switch.
    it("should not re-scan the visitor's own node when the tab regains focus", async () => {
        mocks.cluster = customCluster();

        const { result } = renderSupply(UNTHROTTLED_FOCUS);
        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(mocks.getSupply).toHaveBeenCalledTimes(1);

        await refocusTab();
        // The wait is the assertion: checking straight after the event passes either way.
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(mocks.getSupply).toHaveBeenCalledTimes(1);
    });

    // A laptop waking, a VPN flap, a phone changing network: the same trade as focus, through the one
    // door the other two tests leave open.
    it("should not re-scan the visitor's own node when the connection comes back", async () => {
        mocks.cluster = customCluster();

        const { result } = renderSupply({ dedupingInterval: 0 });
        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(mocks.getSupply).toHaveBeenCalledTimes(1);

        await act(async () => window.dispatchEvent(new Event('online')));
        // The wait is the assertion: checking straight after the event passes either way.
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(mocks.getSupply).toHaveBeenCalledTimes(1);
    });

    // The other half: revisiting inside one session would otherwise re-scan off the cached figure.
    it("should not re-scan the visitor's own node when the page is revisited", async () => {
        mocks.cluster = customCluster();
        // One Map for both mounts, and no deduping, so only staleness can hold the second request back.
        const cache = new Map();
        const sharedCache: SwrOverrides = { dedupingInterval: 0, provider: () => cache };

        const { result: firstVisit, unmount } = renderSupply(sharedCache);
        await waitFor(() => expect(firstVisit.current.kind).toBe('ready'));
        unmount();

        const { result } = renderSupply(sharedCache);
        await waitFor(() => expect(result.current.kind).toBe('ready'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(mocks.getSupply).toHaveBeenCalledTimes(1);
    });

    // The other side of the trade: behind the cache a refresh is free.
    it('should refresh through the route when the tab regains focus', async () => {
        const { result } = renderSupply(UNTHROTTLED_FOCUS);
        await waitFor(() => expect(result.current.kind).toBe('ready'));
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await refocusTab();

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    });

    // An endpoint failing this often will not answer the next attempt either, and a tab may sit open for
    // hours. Uncapped, the route is asked forever, once per interval, per open tab.
    //
    // Deduping off, and the count pinned rather than sampled twice: deduping throttles the retries to one
    // per interval, which leaves any short window unable to tell a retry that stopped from one still
    // waiting its turn — so the sampled version passed whenever the cap was gone.
    it('should stop retrying a failure that keeps repeating', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);

        const { result } = renderSupply({ dedupingInterval: 0 });
        await waitFor(() => expect(result.current.kind).toBe('failed'));
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        expect(fetchMock).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1);
    });

    it('should ask again when the visitor retries a failure', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);

        const { result } = renderSupply();
        await waitFor(() => expect(result.current.kind).toBe('failed'));
        // Let the automatic retries run out, so the recovery below is the visitor's retry.
        await new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));

        const state = result.current;
        if (state.kind !== 'failed' || !state.retry) throw new Error(`expected a retryable failure, got ${state.kind}`);
        fetchMock.mockResolvedValue(supplyResponse());
        await act(async () => state.retry?.());

        await waitFor(() => expect(result.current.kind).toBe('ready'));
    });
});

function renderSupply(overrides: SwrOverrides = {}) {
    return renderHook(() => useSupply(), { wrapper: swrWrapper(overrides) });
}

/** A handle on `mutate`, to force a revalidation the hook does not expose. */
function renderSupplyWithRevalidate() {
    return renderHook(() => ({ revalidate: useSWRConfig().mutate, state: useSupply() }), { wrapper: swrWrapper() });
}

/** A cache per test, so one test's pending promise cannot satisfy the next. Retries stay fast. */
function swrWrapper(overrides: SwrOverrides = {}) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <SWRConfig value={{ errorRetryInterval: 1, provider: () => new Map(), ...overrides }}>{children}</SWRConfig>
        );
    };
}

/** Both throttles off, so a request following a focus is the config's doing and not a coincidence. */
const UNTHROTTLED_FOCUS: SwrOverrides = { dedupingInterval: 0, focusThrottleInterval: 0 };

/** A settled custom endpoint, which goes straight to the node. */
function customCluster() {
    return clusterContext({
        cluster: Cluster.Custom,
        connectableUrl: 'https://my-node.test',
        status: ClusterStatus.Connected,
        url: 'https://my-node.test',
    });
}

async function refocusTab() {
    await act(async () => {
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
    });
}

function supplyResponse(): Response {
    const payload = { circulating: '1', total: '3' };
    return { json: () => Promise.resolve(payload), ok: true } as Response;
}

// What the node reports; `Supply` keeps only the counts something reads.
function rpcSupply() {
    return { circulating: 1n, nonCirculating: 2n, total: 3n };
}
