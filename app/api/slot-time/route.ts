import { getRpc, resolveServerClusterUrl } from '@entities/cluster/server';
import { MEASURED_SAMPLES, toSlotTimePayload } from '@entities/slot-time/server';
import { isRetryableError, isRpcMisconfigError } from '@shared/lib/errors';
import { ERROR_CACHE_HEADERS, isTimeoutError, NO_STORE_HEADERS } from '@shared/lib/http-utils';
import { Logger } from '@shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@shared/lib/timeouts';
import { NextResponse } from 'next/server';

// The rate moves only when a slot-time feature gate activates, at an epoch boundary. A few minutes of
// staleness costs a countdown nothing, and every visitor asks for the same figure.
const SLOT_TIME_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

// Above the RPC bound this route passes to the node, so that bound is what fires and the classified
// branches are what answer, rather than the platform killing the invocation with no headers on the way out.
export const maxDuration = 35;

/** Known clusters only. A custom URL comes from the caller, so the server must never be aimed at it. */
export async function GET(request: Request) {
    const { search, searchParams } = new URL(request.url);
    const clusterParam = searchParams.get('cluster');

    // The CDN keys on the whole URL, so a second spelling of one request is a fresh miss. Comparing the
    // raw query against the param it parsed to leaves one URL that reaches the node: the one every
    // visitor's client already sends.
    if (clusterParam === null || search !== `?cluster=${clusterParam}`) {
        // Console only, like every refusal a caller can provoke: reporting one would hand anyone a way
        // to raise alerts.
        Logger.warn('[api:slot-time] Rejected a query that is not the canonical shape');
        return NextResponse.json({ error: 'Invalid query params' }, { headers: NO_STORE_HEADERS, status: 400 });
    }

    const context = { cluster: clusterParam };
    const resolved = resolveServerClusterUrl(clusterParam);

    if (resolved.kind === 'refused') {
        Logger.warn('[api:slot-time] Refused a cluster the server must not resolve', context);
        return NextResponse.json({ error: 'Invalid cluster' }, { headers: NO_STORE_HEADERS, status: 400 });
    }

    if (resolved.kind === 'unconfigured') {
        // Ours, and no caller can provoke it: every countdown on this cluster is absent until someone
        // sets an endpoint for it, and nothing else would say so.
        Logger.error(new Error('[api:slot-time] No endpoint configured for cluster'), {
            sentry: true,
            sentryExtras: context,
        });
        return NextResponse.json({ error: 'Cluster not configured' }, { headers: ERROR_CACHE_HEADERS, status: 500 });
    }

    try {
        const rpc = getRpc(resolved.url);
        const samples = await rpc
            .getRecentPerformanceSamples(MEASURED_SAMPLES)
            // A wedged node would otherwise hold the function open long past any useful answer.
            .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

        return NextResponse.json(toSlotTimePayload(samples), { headers: SLOT_TIME_CACHE_HEADERS });
    } catch (error) {
        if (isTimeoutError(error)) {
            Logger.warn('[api:slot-time] RPC request timed out', { sentry: true, sentryExtras: context });
            return NextResponse.json(
                { error: 'Upstream request timed out' },
                { headers: ERROR_CACHE_HEADERS, status: 504 },
            );
        }

        if (isRetryableError(error)) {
            Logger.warn('[api:slot-time] RPC error fetching performance samples', {
                sentry: true,
                sentryExtras: { ...context, rpcError: error instanceof Error ? error.message : String(error) },
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { headers: ERROR_CACHE_HEADERS, status: 503 });
        }

        // 502 is what tells the client not to ask again: someone has to change configuration first.
        if (isRpcMisconfigError(error)) {
            Logger.error(error, { sentry: true, sentryExtras: { ...context, reason: 'rpc-refused' } });
            return NextResponse.json({ error: 'Upstream RPC error' }, { headers: ERROR_CACHE_HEADERS, status: 502 });
        }

        // A node answering with samples that state no rate lands here too, alongside the connection
        // failures nothing above recognises. Both are worth looking at, and neither says the next attempt
        // fails the same way, so 502 stays reserved for a node that refuses.
        Logger.error(new Error('[api:slot-time] Request failed', { cause: error }), {
            sentry: true,
            sentryExtras: {
                ...context,
                reason: 'unclassified',
                rpcError: error instanceof Error ? error.message : String(error),
            },
        });
        return NextResponse.json(
            { error: 'Failed to measure slot time' },
            { headers: ERROR_CACHE_HEADERS, status: 503 },
        );
    }
}
