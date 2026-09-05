import { MEASURED_SAMPLES } from '@entities/slot-time/server';
import {
    createSolanaRpc,
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaError,
} from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { ROUTE_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';
import { Cluster } from '@/app/utils/cluster';

import { GET, maxDuration } from '../route';

const mocks = vi.hoisted(() => ({ getRecentPerformanceSamples: vi.fn(), send: vi.fn() }));

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return {
        ...actual,
        createSolanaRpc: vi.fn(() => ({ getRecentPerformanceSamples: mocks.getRecentPerformanceSamples })),
    };
});

// Stubbed, so a local `.env` cannot decide what the route resolves to — an empty one would fail these
// tests for a reason that has nothing to do with the route.
const MAINNET_RPC_URL = 'https://mainnet.test/rpc';
const TESTNET_RPC_URL = 'https://testnet.test/rpc';

const NO_STORE = 'no-store, max-age=0';
const ERROR_CACHE = 'public, max-age=30, s-maxage=30';

// Testnet in September 2026: 319 slots a minute, the rate the 200 ms gate produced there.
const SAMPLES = [{ numSlots: 319n, samplePeriodSecs: 60 }];

describe('GET /api/slot-time', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('MAINNET_RPC_URL', MAINNET_RPC_URL);
        vi.stubEnv('TESTNET_RPC_URL', TESTNET_RPC_URL);
        mocks.getRecentPerformanceSamples.mockReturnValue({ send: mocks.send });
        mocks.send.mockResolvedValue(SAMPLES);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    // Otherwise a route that resolved every cluster to mainnet would pass the whole suite, and testnet
    // visitors would count down at mainnet's rate — the very mix-up this route exists to end.
    it.each([
        ['mainnet-beta', Cluster.MainnetBeta, MAINNET_RPC_URL],
        ['testnet', Cluster.Testnet, TESTNET_RPC_URL],
    ])('should dial the endpoint configured for %s', async (_name, cluster, expectedUrl) => {
        await GET(createRequest(cluster));

        expect(createSolanaRpc).toHaveBeenCalledWith(expectedUrl);
    });

    it('should return the measured rate', async () => {
        const response = await GET(createRequest(Cluster.Testnet));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ msPerSlot: 188 });
    });

    it('should measure over the window both fetch paths use', async () => {
        await GET(createRequest(Cluster.MainnetBeta));

        expect(mocks.getRecentPerformanceSamples).toHaveBeenCalledWith(MEASURED_SAMPLES);
    });

    it('should cache a successful response at the CDN', async () => {
        const response = await GET(createRequest(Cluster.MainnetBeta));

        expect(response.headers.get('Cache-Control')).toBe(
            'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
        );
    });

    // The value, not just the presence: a signal is a signal at any duration, and one set above the
    // function's own budget lets the platform kill the invocation before the classified answer is written.
    it('should bound the call with a deadline, so a wedged node cannot hold the function open', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        await GET(createRequest(Cluster.MainnetBeta));

        expect(mocks.send).toHaveBeenCalledWith({ abortSignal: expect.any(AbortSignal) });
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });

    it('should keep the RPC bound under the function duration, and that under the browser’s', () => {
        expect(UPSTREAM_TIMEOUT_MS).toBeLessThan(maxDuration * 1000);
        expect(maxDuration * 1000).toBeLessThan(ROUTE_TIMEOUT_MS);
    });

    describe('requests it will not answer', () => {
        it('should return an uncached 400 when the cluster param is missing', async () => {
            const response = await GET(new Request('http://localhost:3000/api/slot-time'));

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Invalid query params' });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE);
            expect(mocks.getRecentPerformanceSamples).not.toHaveBeenCalled();
        });

        // The CDN keys on the whole URL, so every extra spelling of one request is another miss. One
        // shape gets answered, and nothing else reaches the node.
        it.each([
            ['an unexpected extra param', `?cluster=${Cluster.MainnetBeta}&bust=1`],
            ['a repeated param', `?cluster=${Cluster.MainnetBeta}&cluster=${Cluster.MainnetBeta}`],
            ['a percent-encoded digit', '?cluster=%30'],
            ['the param in another position', `?bust=1&cluster=${Cluster.MainnetBeta}`],
        ])('should refuse %s without asking the node', async (_reason, query) => {
            const response = await GET(new Request(`http://localhost:3000/api/slot-time${query}`));

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Invalid query params' });
            expect(mocks.getRecentPerformanceSamples).not.toHaveBeenCalled();
        });

        // The server must never resolve a custom endpoint: its URL comes from the caller. An unknown
        // cluster is the same refusal for the same reason.
        it.each([
            ['the custom cluster', Cluster.Custom.toString()],
            ['an unknown cluster', '999'],
            ['a param that is not an integer', '0x0'],
            ['a leading-zero param, which Number() would coerce', '01'],
        ])('should return an uncached 400 for %s', async (_reason, cluster) => {
            const response = await GET(new Request(`http://localhost:3000/api/slot-time?cluster=${cluster}`));

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Invalid cluster' });
            expect(response.headers.get('Cache-Control')).toBe(NO_STORE);
            expect(mocks.getRecentPerformanceSamples).not.toHaveBeenCalled();
        });

        // Anyone can ask for these, so a report would be a way for anyone to raise an alert. Pinned on the
        // call shape rather than the level: a warning reaches Sentry too, the moment it is handed a
        // context, so asserting the level alone would let one be added here unnoticed.
        it.each([
            ['a query that is not the canonical shape', `?cluster=${Cluster.MainnetBeta}&bust=1`],
            ['a cluster the server must not resolve', '?cluster=999'],
        ])('should keep the refusal for %s out of Sentry', async (_reason, query) => {
            await GET(new Request(`http://localhost:3000/api/slot-time${query}`));

            expect(Logger.warn).toHaveBeenCalled();
            expect(vi.mocked(Logger.warn).mock.calls.map(([, context]) => context)).not.toContainEqual(
                expect.objectContaining({ sentry: true }),
            );
            expect(Logger.error).not.toHaveBeenCalled();
            expect(Logger.panic).not.toHaveBeenCalled();
        });
    });

    // A cluster we own with no endpoint set: every countdown on it is absent until someone fixes that,
    // and no caller can provoke it, so this is the one refusal that has to reach Sentry.
    it('should report a known cluster with no endpoint configured', async () => {
        vi.stubEnv('TESTNET_RPC_URL', '');

        const response = await GET(createRequest(Cluster.Testnet));

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Cluster not configured' });
        expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
        expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), reported({ cluster: Cluster.Testnet.toString() }));
        expect(mocks.getRecentPerformanceSamples).not.toHaveBeenCalled();
    });

    describe('upstream failures', () => {
        // The route is the only place that can catch this. Served as a 200 it would be cached for
        // everyone, and every countdown would then be drawn against a rate nothing measured.
        it.each([
            ['samples covering no slot', [{ numSlots: 0n, samplePeriodSecs: 60 }]],
            ['no samples at all', []],
        ])('should refuse %s rather than serve a rate', async (_reason, samples) => {
            mocks.send.mockResolvedValueOnce(samples);

            const response = await GET(createRequest(Cluster.MainnetBeta));

            // Unclassified: one node behind a balancer may have history the next one lacks, so it stays
            // re-askable.
            expect(response.status).toBe(503);
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
            expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), reported({ reason: 'unclassified' }));
        });

        // Warned, never escalated: this route is public, so a slow node must not become a way to page
        // anyone. Cached briefly, so one visitor's retries cost a cache hit rather than another call.
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
            expect(Logger.warn).toHaveBeenCalledWith(expect.any(String), reported({ rpcError: expect.any(String) }));
            expect(Logger.error).not.toHaveBeenCalled();
        });

        // Needs a configuration change, not a page — a node that serves no performance samples at all is
        // the likely one here.
        it.each([
            [
                'a method the node will not serve',
                new SolanaError(SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND, { __serverMessage: 'Method not found' }),
            ],
            ['credentials the node will not take', httpError(401)],
        ])('should report, and briefly cache, %s', async (_reason, error) => {
            mocks.send.mockRejectedValueOnce(error);

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).toBe(502);
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE);
            expect(Logger.error).toHaveBeenCalledWith(expect.anything(), reported({ reason: 'rpc-refused' }));
            expect(Logger.panic).not.toHaveBeenCalled();
        });

        // Nothing here can say the next attempt fails the same way, so 502 stays reserved for a refusal.
        it('should report an unrecognised connection failure, and leave it re-askable', async () => {
            mocks.send.mockRejectedValueOnce(connectionFailure('ENOTFOUND'));

            const response = await GET(createRequest(Cluster.MainnetBeta));

            expect(response.status).toBe(503);
            expect(await response.json()).toEqual({ error: 'Failed to measure slot time' });
            expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), reported({ reason: 'unclassified' }));
            expect(Logger.panic).not.toHaveBeenCalled();
        });
    });
});

function createRequest(cluster: Cluster) {
    return new Request(`http://localhost:3000/api/slot-time?cluster=${cluster}`);
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
