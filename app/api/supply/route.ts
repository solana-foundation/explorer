import { getRpc, resolveServerClusterUrl } from '@entities/cluster/server';
import { isRetryableError, isRpcMisconfigError } from '@shared/lib/errors';
import { NextResponse } from 'next/server';

import { toSupplyPayload } from '@/app/features/supply/server';
import { ERROR_CACHE_HEADERS, isTimeoutError, NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';
import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

// The card rounds hard enough that supply looks the same all day, so the TTL is set to spare the node
// rather than to stay fresh. Every CDN region revalidates on its own, and each miss is a ledger scan.
const SUPPLY_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600',
};

// Above the RPC bound this route passes to the node, so that bound is what fires and the classified
// branches are what answer, rather than the platform killing the invocation with no headers on the way out.
export const maxDuration = 35;

/** Known clusters only. A custom URL comes from the caller, so the server must never be aimed at it. */
export async function GET(request: Request) {
    const { search, searchParams } = new URL(request.url);
    const clusterParam = searchParams.get('cluster');

    // The CDN keys on the whole URL, so a second spelling of one request is a fresh miss — and each miss is
    // a full ledger scan any caller can ask for. Comparing the raw query against the param it parsed to
    // leaves one URL that reaches the node: the one every visitor's client already sends.
    if (clusterParam === null || search !== `?cluster=${clusterParam}`) {
        // Console only, like every refusal a caller can provoke: reporting one would hand anyone a way
        // to raise alerts.
        Logger.warn('[api:supply] Rejected a query that is not the canonical shape');
        return NextResponse.json({ error: 'Invalid query params' }, { headers: NO_STORE_HEADERS, status: 400 });
    }

    const context = { cluster: clusterParam };
    const resolved = resolveServerClusterUrl(clusterParam);

    if (resolved.kind === 'refused') {
        Logger.warn('[api:supply] Refused a cluster the server must not resolve', context);
        return NextResponse.json({ error: 'Invalid cluster' }, { headers: NO_STORE_HEADERS, status: 400 });
    }

    if (resolved.kind === 'unconfigured') {
        // Ours, and no caller can provoke it: this cluster's card is dead for everyone until someone sets
        // an endpoint for it, and nothing else would say so.
        Logger.error(new Error('[api:supply] No endpoint configured for cluster'), {
            sentry: true,
            sentryExtras: context,
        });
        return NextResponse.json({ error: 'Cluster not configured' }, { headers: ERROR_CACHE_HEADERS, status: 500 });
    }

    try {
        const rpc = getRpc(resolved.url);
        // A wedged node would otherwise hold the function open long past any useful answer.
        const { value } = await rpc
            .getSupply({ commitment: 'finalized', excludeNonCirculatingAccountsList: true })
            .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

        return NextResponse.json(toSupplyPayload(value), { headers: SUPPLY_CACHE_HEADERS });
    } catch (error) {
        // Every failure below is cached in the visitor's browser, so the retries that follow one answer
        // cost nothing. Nothing bounds them across visitors, though: a shared cache will not hold an error
        // status, so a slow node is recorded once per visitor rather than once.
        if (isTimeoutError(error)) {
            Logger.warn('[api:supply] RPC request timed out', { sentry: true, sentryExtras: context });
            return NextResponse.json(
                { error: 'Upstream request timed out' },
                { headers: ERROR_CACHE_HEADERS, status: 504 },
            );
        }

        if (isRetryableError(error)) {
            Logger.warn('[api:supply] RPC error fetching supply', {
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

        // Usually still the connection — a name that stops resolving, a certificate nothing accepts, a
        // proxy answering with HTML — so it answers where a client may ask again, and 502 stays reserved
        // for a node that refuses. Reported even so: a failure nothing here recognises is one to look at.
        Logger.error(new Error('[api:supply] Request failed', { cause: error }), {
            sentry: true,
            sentryExtras: {
                ...context,
                reason: 'unclassified',
                rpcError: error instanceof Error ? error.message : String(error),
            },
        });
        return NextResponse.json({ error: 'Failed to fetch supply' }, { headers: ERROR_CACHE_HEADERS, status: 503 });
    }
}
