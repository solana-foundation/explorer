import { type ConnectableUrl } from '@entities/cluster';

import { Logger } from '@/app/shared/lib/logger';
import { isMethodNotFound } from '@/app/shared/lib/rpc-errors';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { type AlpenglowGenesisCert, parseGenesisCert } from '../lib/genesis-cert';

/**
 * What a node can say about the Alpenglow migration. `unsupported`, `refused` and `unreadable` are
 * answers rather than failures: the endpoint does not have this method, will not serve this caller,
 * or served something that is not a certificate. The next request gets the same reply, so all three
 * are carried as values — and against `refused` the retries are the very thing being limited.
 */
export type AgGenesisCertAnswer =
    | { kind: 'unsupported' }
    | { kind: 'refused' }
    | { kind: 'unreadable' }
    | { kind: 'absent' }
    | { kind: 'present'; cert: AlpenglowGenesisCert };

const METHOD = 'getAgGenesisCert';

// Observed against `explorer-api.mainnet-beta.solana.com`, which refuses this method with it while
// answering getEpochInfo from the same caller in the same second.
const RATE_LIMITED = 429;

// The endpoint will not serve this caller — typically a missing or wrong key on a custom RPC. The
// next request carries the same key, so retrying only spends it against the same wall.
const UNAUTHORIZED = [401, 403];

/**
 * Asks a node for the Alpenglow genesis certificate. Called directly rather than through
 * `@solana/kit`, which does not carry this method at the version this repo pins.
 *
 * From the browser rather than a cached server route: this is a constant-size lookup with no
 * ledger scan behind it, and a route would reach only known clusters — so the direct path has to
 * exist for a custom or local endpoint regardless, and the route would be the second one.
 *
 * Throws only what a later request might answer differently: a 5xx, a timeout, a lagging replica.
 * Anything the node has settled — no such method, no access for this caller, a result that is not a
 * certificate — comes back as a value instead, so it is never retried.
 */
export async function fetchAgGenesisCert(url: ConnectableUrl): Promise<AgGenesisCertAnswer> {
    const response = await fetch(url, {
        body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: METHOD }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        // Without one, a connection accepted and never answered leaves the card waiting for good.
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    // Body before status. Endpoints disagree on the status that carries "method not found" —
    // Agave answers 200, Helius answers 404 — so the body is the only reliable signal, and
    // consulting `ok` first would file a settled answer as a retryable failure.
    const body = await response.json().catch(() => undefined);

    // A null `error` beside a valid result is a real thing some implementations send, so absence
    // here means both shapes of "no error": the field missing, and the field present but null.
    const rpcError = isRecord(body) && body.error !== null ? body.error : undefined;

    // Most specific first: Helius reports a missing method at HTTP 404, so neither the status nor
    // the generic error branch below would read it correctly.
    if (rpcError !== undefined && isMethodNotFound(rpcError)) return { kind: 'unsupported' };

    // A rate limit arrives two ways. Triton puts it in the error body; anything standing in front
    // of a node answers a bare 429, often with an HTML page and so with no body to read at all.
    // Both must land here rather than in the throw below, because retrying is what is limited.
    if (response.status === RATE_LIMITED || (isRecord(rpcError) && rpcError.code === RATE_LIMITED)) {
        // Worth saying out loud, unlike `unsupported`: a limit can be raised, and an endpoint
        // refusing only this method is a configuration someone can change.
        Logger.warn(`[alpenglow] ${METHOD} is rate-limited at this endpoint`, { status: response.status });
        return { kind: 'refused' };
    }

    // Before the throw below for the same reason as the limit: the key is not going to change
    // between attempts, and this too is a configuration someone can fix.
    if (UNAUTHORIZED.includes(response.status)) {
        Logger.warn(`[alpenglow] ${METHOD} is not authorized at this endpoint`, { status: response.status });
        return { kind: 'refused' };
    }

    if (rpcError !== undefined) {
        throw new Error(`${METHOD}: ${rpcErrorMessage(rpcError)}`);
    }
    if (!response.ok) {
        throw new Error(`${METHOD}: HTTP ${response.status}`);
    }
    // `result: null` is the pre-migration answer, so it has to be told apart from no result at all.
    // The shape is checked first: a proxy answering `200` with a bare JSON string or number is not
    // something the `in` operator can be pointed at.
    if (!isRecord(body) || !('result' in body)) {
        throw new Error(`${METHOD}: malformed response`);
    }
    if (body.result === null) return { kind: 'absent' };

    try {
        return { cert: parseGenesisCert(body.result), kind: 'present' };
    } catch (cause) {
        // The node answered, and will answer the same way next time. Worth saying out loud —
        // a node minting a certificate this app cannot read is someone's bug.
        Logger.warn(`[alpenglow] ${METHOD} returned a result that is not a certificate`, { cause });
        return { kind: 'unreadable' };
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

// An endpoint is free to put anything in `error`. Only a string reaches the message, so an object
// there cannot reach a log as "[object Object]" and take the diagnostic with it.
function rpcErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (isRecord(error) && typeof error.message === 'string') return error.message;
    return 'RPC error';
}
