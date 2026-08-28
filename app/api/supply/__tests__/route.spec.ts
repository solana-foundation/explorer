import {
    createSolanaRpc,
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND,
    SOLANA_ERROR__JSON_RPC__PARSE_ERROR,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaError,
} from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { ROUTE_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';
import { Cluster } from '@/app/utils/cluster';

import { GET, maxDuration } from '../route';

const mocks = vi.hoisted(() => ({ getSupply: vi.fn(), send: vi.fn() }));

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return { ...actual, createSolanaRpc: vi.fn(() => ({ getSupply: mocks.getSupply })) };
});

// Stubbed, so a local `.env` cannot decide what the route resolves to — an empty one would fail these
// tests for a reason that has nothing to do with the route.
const MAINNET_RPC_URL = 'https://mainnet.test/rpc';
const TESTNET_RPC_URL = 'https://testnet.test/rpc';

const NO_STORE = 'no-store, max-age=0';
const ERROR_CACHE = 'public, max-age=30, s-maxage=30';

// Well past 2^53, so figures travelling as JSON numbers would fail this. The node reports
// `nonCirculating`; the payload drops it.
const SUPPLY = {
    circulating: 510_345_678_123_456_789n,
    nonCirculating: 80_123_456_987_654_321n,
    total: 590_469_135_111_111_110n,
};

describe('GET /api/supply', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('MAINNET_RPC_URL', MAINNET_RPC_URL);
        vi.stubEnv('TESTNET_RPC_URL', TESTNET_RPC_URL);
        mocks.getSupply.mockReturnValue({ send: mocks.send });
        mocks.send.mockResolvedValue({ value: SUPPLY });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    // Otherwise a route that resolved every cluster to mainnet would pass the whole suite, and devnet
    // visitors would get mainnet's supply cached under their own key.
    it.each([
        ['mainnet-beta', Cluster.MainnetBeta, MAINNET_RPC_URL],
        ['testnet', Cluster.Testnet, TESTNET_RPC_URL],
    ])('should dial the endpoint configured for %s', async (_name, cluster, expectedUrl) => {
        await GET(createRequest(cluster));

        expect(createSolanaRpc).toHaveBeenCalledWith(expectedUrl);
    });

    it('should return supply as decimal strings', async () => {
        const response = await GET(createRequest(Cluster.MainnetBeta));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            circulating: '510345678123456789',
            total: '590469135111111110',
        });
    });

    it('should skip the non-circulating account list, which the home page never reads', async () => {
        await GET(createRequest(Cluster.MainnetBeta));

        expect(mocks.getSupply).toHaveBeenCalledWith({
            commitment: 'finalized',
            excludeNonCirculatingAccountsList: true,
        });
    });

    it('should cache a successful response at the CDN', async () => {
        const response = await GET(createRequest(Cluster.MainnetBeta));

        expect(response.headers.get('Cache-Control')).toBe(
            'public, max-age=60, s-maxage=600, stale-while-revalidate=3600',
        );
    });

    // The value, not just the presence: a signal is a signal at any duration, and one set above the
    // function's own budget lets the platform kill the invocation before the classified answer is written.
    it('should bound the scan with a deadline, so a wedged node cannot hold the function open', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        await GET(createRequest(Cluster.MainnetBeta));

        expect(mocks.send).toHaveBeenCalledWith({ abortSignal: expect.any(AbortSignal) });
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });

    // Three deadlines that only work in this order. Push the RPC bound past the function duration and the
    // platform kills the invocation instead, so the visitor gets a platform 504 carrying none of the cache
    // headers below, and nothing records it at either end. Let the browser's bound fall under the function
    // duration and the route's classified answer never arrives.
    it('should keep the RPC bound under the function duration, and that under the browser’s', () => {
        expect(UPSTREAM_TIMEOUT_MS).toBeLessThan(maxDuration * 1000);
        expect(maxDuration * 1000).toBeLessThan(ROUTE_TIMEOUT_MS);
    });

    describe('requests it will not answer', () => {
        it('should return an uncached 400 when the cluster param is missing', async () => {
            const response = await GET(new Request('http://localhost:3000/api/supply'));

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Invalid query params' });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE);
            expect(mocks.getSupply).not.toHaveBeenCalled();
        });

        // The CDN keys on the whole URL, so every extra spelling of one request is another ledger scan a
        // caller can ask for. One shape gets answered, and nothing else reaches the node.
        it.each([
            ['an unexpected extra param', `?cluster=${Cluster.MainnetBeta}&bust=1`],
            ['a repeated param', `?cluster=${Cluster.MainnetBeta}&cluster=${Cluster.MainnetBeta}`],
            ['a percent-encoded digit', '?cluster=%30'],
            ['the param in another position', `?bust=1&cluster=${Cluster.MainnetBeta}`],
        ])('should refuse %s without asking the node', async (_reason, query) => {
            const response = await GET(new Request(`http://localhost:3000/api/supply${query}`));

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Invalid query params' });
            expect(mocks.getSupply).not.toHaveBeenCalled();
        });

        // The server must never resolve a custom endpoint: its URL comes from the caller. An unknown
        // cluster is the same refusal for the same reason.
        it.each([
            ['the custom cluster', Cluster.Custom.toString()],
            ['an unknown cluster', '999'],
            ['a param that is not an integer', '0x0'],
            ['a leading-zero param, which Number() would coerce', '01'],
        ])('should return an uncached 400 for %s', async (_reason, cluster) => {
            const response = await GET(new Request(`http://localhost:3000/api/supply?cluster=${cluster}`));

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Invalid cluster' });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE);
            expect(mocks.getSupply).not.toHaveBeenCalled();
        });

        // Anyone can ask for these, so a report would be a way for anyone to raise an alert. Pinned on the
        // call shape rather than the level: a warning reaches Sentry too, the moment it is handed a
        // context, so asserting the level alone would let one be added here unnoticed.
        it.each([
            ['a query that is not the canonical shape', `?cluster=${Cluster.MainnetBeta}&bust=1`],
            ['a cluster the server must not resolve', '?cluster=999'],
        ])('should keep the refusal for %s out of Sentry', async (_reason, query) => {
            await GET(new Request(`http://localhost:3000/api/supply${query}`));

            expect(Logger.warn).toHaveBeenCalled();
            expect(vi.mocked(Logger.warn).mock.calls.map(([, context]) => context)).not.toContainEqual(
                expect.objectContaining({ sentry: true }),
            );
            expect(Logger.error).not.toHaveBeenCalled();
            expect(Logger.panic).not.toHaveBeenCalled();
        });
    });

    // A cluster we own with no endpoint set: every visitor's card is dead until someone fixes it, and no
    // caller can provoke it, so this is the one refusal that has to reach Sentry.
    it('should report a known cluster with no endpoint configured', async () => {
        vi.stubEnv('TESTNET_RPC_URL', '');

        const response = await GET(createRequest(Cluster.Testnet));

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Cluster not configured' });
        expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
        // Under `sentryExtras`, because that is the only part of the context Sentry receives — a plain
        // field would report which cluster is dead to the console alone.
        expect(Logger.error).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                sentry: true,
                sentryExtras: expect.objectContaining({ cluster: Cluster.Testnet.toString() }),
            }),
        );
        expect(mocks.getSupply).not.toHaveBeenCalled();
    });

    describe('upstream failures', () => {
        // The route is the only place that can catch this. Served as a 200 it would be cached for
        // everyone, and every client would reject the body and report the disagreement as its own.
        it.each([
            ['a circulating figure above the total', { circulating: 590_469_135_111_111_111n }],
            ['an amount outside the u64 range', { total: 2n ** 64n }],
        ])('should refuse %s rather than serve it', async (_reason, overrides) => {
            mocks.send.mockResolvedValueOnce({ value: { ...SUPPLY, ...overrides } });

            const response = await GET(createRequest(Cluster.MainnetBeta));

            // Unclassified: one node behind a balancer may disagree with the next, so it stays re-askable.
            expect(response.status).toBe(503);
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
            expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), reported({ reason: 'unclassified' }));
        });

        // Warned, never escalated: this route is public, so a slow node must not become a way to page
        // anyone. Cached briefly, so one visitor's retries cost a cache hit rather than another scan.
        it('should warn and briefly cache a 504 when the node misses the deadline', async () => {
            mocks.send.mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'));

            const response = await GET(createRequest(Cluster.Testnet));

            expect(response.status).toBe(504);
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
            expect(Logger.warn).toHaveBeenCalledWith(
                expect.any(String),
                reported({ cluster: Cluster.Testnet.toString() }),
            );
            expect(Logger.error).not.toHaveBeenCalled();
            expect(Logger.panic).not.toHaveBeenCalled();
        });

        // 503 rather than 502: the client retries this tier and leaves the refusal tier alone, which it
        // cannot do if both answer with one status.
        it('should warn and briefly cache a 503 on a transient RPC error', async () => {
            mocks.send.mockRejectedValueOnce(
                new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' }),
            );

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).toBe(503);
            expect(await response.json()).toEqual({ error: 'Upstream RPC error' });
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
            expect(Logger.warn).toHaveBeenCalledWith(
                expect.any(String),
                reported({ cluster: Cluster.MainnetBeta.toString(), rpcError: expect.any(String) }),
            );
            expect(Logger.error).not.toHaveBeenCalled();
            expect(Logger.panic).not.toHaveBeenCalled();
        });

        // Needs a configuration change, not a page. Cached briefly so one visitor's retries do not each
        // reach the node again.
        it('should report, and briefly cache, a call the node refuses to serve', async () => {
            mocks.send.mockRejectedValueOnce(
                new SolanaError(SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND, { __serverMessage: 'Method not found' }),
            );

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).toBe(502);
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
            expect(Logger.error).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    sentry: true,
                    sentryExtras: expect.objectContaining({
                        cluster: Cluster.MainnetBeta.toString(),
                        reason: 'rpc-refused',
                    }),
                }),
            );
            expect(Logger.panic).not.toHaveBeenCalled();
        });

        // The likeliest 502 a deploy actually produces, and the one the suite reached only as a predicate:
        // the node answers over HTTP rather than in JSON-RPC, so it arrives on a different error shape.
        it.each([
            ['credentials the node will not take', 401],
            ['a rejected key', 403],
            ['an RPC path that is not there', 404],
        ])('should answer 502 for %s', async (_reason, statusCode) => {
            mocks.send.mockRejectedValueOnce(httpError(statusCode));

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).toBe(502);
            expect(Logger.error).toHaveBeenCalledWith(expect.anything(), reported({ reason: 'rpc-refused' }));
        });

        // Same error shape as the three above, and the two tiers must stay disjoint over it: the refusal
        // check excludes exactly these, so a busy node cannot land on the one tier the client never
        // re-asks — whichever order the branches end up in.
        it.each([
            ['a rate-limited node', 429],
            ['a node behind a failing proxy', 503],
        ])('should answer 503, not 502, for %s', async (_reason, statusCode) => {
            mocks.send.mockRejectedValueOnce(httpError(statusCode));

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).toBe(503);
            expect(Logger.warn).toHaveBeenCalledWith(expect.any(String), reported({ rpcError: expect.any(String) }));
            expect(Logger.error).not.toHaveBeenCalled();
        });

        // A node saying it could not parse our request is not somebody else's configuration. Classifying
        // by elimination would have filed it under one.
        it('should not call a rejected request body a misconfiguration', async () => {
            mocks.send.mockRejectedValueOnce(
                new SolanaError(SOLANA_ERROR__JSON_RPC__PARSE_ERROR, { __serverMessage: 'Parse error' }),
            );

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(await response.json()).toEqual({ error: 'Failed to fetch supply' });
            expect(Logger.error).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({
                    sentry: true,
                    sentryExtras: expect.objectContaining({ reason: 'unclassified' }),
                }),
            );
        });

        // A name that stops resolving and a TLS handshake nothing completes are upstream, not a caller's
        // doing, and neither is fixed by waking someone at night. Both answer where a client may ask
        // again, since nothing here can say the next attempt fails the same way.
        it.each([
            ['a name that stops resolving', 'ENOTFOUND'],
            ['a TLS handshake the client will not complete', 'EPROTO'],
        ])('should report %s, and leave it re-askable', async (_reason, code) => {
            mocks.send.mockRejectedValueOnce(connectionFailure(code));

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).toBe(503);
            expect(await response.json()).toEqual({ error: 'Failed to fetch supply' });
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
            expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), reported({ reason: 'unclassified' }));
            expect(Logger.panic).not.toHaveBeenCalled();
        });

        // 502 belongs to a node that refuses the call, and to nothing else: it is the one answer the
        // client is told not to ask again, so an unrecognised connection fault must not land on it.
        it('should keep 502 for a refusal alone', async () => {
            mocks.send.mockRejectedValueOnce(connectionFailure('ENOTFOUND'));

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).not.toBe(502);
        });

        // A DNS blip and a reset socket clear on their own, so they belong with the warnings.
        it.each([['EAI_AGAIN'], ['EHOSTUNREACH'], ['ENETUNREACH'], ['ECONNABORTED']])(
            'should treat a %s connection failure as transient',
            async code => {
                mocks.send.mockRejectedValueOnce(connectionFailure(code));

                const response = await GET(createRequest(Cluster.MainnetBeta));

                expect(response.status).toBe(503);
                expect(Logger.warn).toHaveBeenCalledWith(
                    expect.any(String),
                    reported({ rpcError: expect.any(String) }),
                );
                expect(Logger.error).not.toHaveBeenCalled();
            },
        );
    });
});

function createRequest(cluster: Cluster) {
    return new Request(`http://localhost:3000/api/supply?cluster=${cluster}`);
}

/** A node answering over HTTP rather than in JSON-RPC: a gateway, a key check, a wrong path. */
function httpError(statusCode: number) {
    return new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
        headers: new Headers(),
        message: `HTTP ${statusCode}`,
        statusCode,
    });
}

/** Shaped the way undici reports one: the code sits on an `Error` nested as `cause`. */
function connectionFailure(code: string) {
    const cause = Object.assign(new Error(`${code} on connect`), { code });
    return Object.assign(new TypeError('fetch failed'), { cause });
}

/**
 * What has to be on a log call for the failure to reach Sentry at all: the flag, and the reason under
 * `sentryExtras`, which is the only part of a context Sentry receives. A bare `toHaveBeenCalled` passes
 * with both dropped, and the tier then fails silently for everyone.
 */
function reported(extras: Record<string, unknown>) {
    return expect.objectContaining({ sentry: true, sentryExtras: expect.objectContaining(extras) });
}
