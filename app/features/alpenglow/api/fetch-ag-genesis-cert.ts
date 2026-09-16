import { type ConnectableUrl } from '@entities/cluster';
import { createSolanaRpc, isSolanaError, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';
import { isMethodNotFound } from '@/app/shared/lib/rpc-errors';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { type AlpenglowGenesisCert, parseGenesisCert } from '../lib/genesis-cert';

/**
 * What a node can say about the Alpenglow migration.
 *
 * `unsupported`, `refused` and `unreadable` are settled: the next request gets the same reply, so
 * they are values rather than throws. Retrying `refused` only makes the rate limit worse.
 */
export type AgGenesisCertAnswer =
    | { kind: 'unsupported' }
    | { kind: 'refused' }
    | { kind: 'unreadable' }
    | { kind: 'absent' }
    | { kind: 'present'; cert: AlpenglowGenesisCert };

const METHOD = 'getAgGenesisCert';

// Some providers decline an unsupported method with an HTTP status instead of a JSON-RPC error. kit
// throws on the status, so the body never reaches the classifier.
const NOT_SERVED = 404;

// Some endpoints rate-limit this method alone while still serving others.
const RATE_LIMITED = 429;

// The endpoint will not serve this caller, typically a missing or wrong key on a custom RPC. The
// next request carries the same key, so retrying cannot help.
const UNAUTHORIZED = [401, 403];

/**
 * Fetches the Alpenglow genesis certificate from the RPC endpoint.
 *
 * Throws transient errors so the caller retries. Returns settled answers as values.
 */
export async function fetchAgGenesisCert(url: ConnectableUrl): Promise<AgGenesisCertAnswer> {
    let result;
    try {
        result = await createSolanaRpc(url)
            .getAgGenesisCert()
            // An accepted connection that never answers would hang forever.
            .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    } catch (error) {
        const settled = classifyDecline(error);
        if (settled === undefined) throw error;
        return settled;
    }

    // Before the transition, no certificate exists, so the node answers null.
    if (result === null) return { kind: 'absent' };

    try {
        return { cert: parseGenesisCert(result), kind: 'present' };
    } catch (cause) {
        // A malformed certificate means the node is producing bad data, so it is worth logging.
        Logger.warn(`[alpenglow] ${METHOD} returned a result that is not a certificate`, { cause });
        return { kind: 'unreadable' };
    }
}

/** Returns a settled answer, or `undefined` for a transient error the caller must rethrow. */
function classifyDecline(error: unknown): AgGenesisCertAnswer | undefined {
    if (isMethodNotFound(asJsonRpcError(error))) return { kind: 'unsupported' };
    if (!isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) return undefined;

    const { statusCode } = error.context;
    if (statusCode === NOT_SERVED) return { kind: 'unsupported' };
    if (statusCode === RATE_LIMITED || UNAUTHORIZED.includes(statusCode)) {
        // A rate limit can be raised and a key can be corrected, unlike an unsupported method.
        Logger.warn(`[alpenglow] ${METHOD} was refused at this endpoint`, { status: statusCode });
        return { kind: 'refused' };
    }
    return undefined;
}

// kit reshapes a JSON-RPC error into a `SolanaError`, moving the code onto the context and the
// node's own message under `__serverMessage`. Put back into the shape the classifier reads.
function asJsonRpcError(error: unknown): { code?: number; message?: string } | undefined {
    if (!isSolanaError(error)) return undefined;
    const { __code: code, __serverMessage: message } = error.context as {
        __code?: number;
        __serverMessage?: string;
    };
    return { code, message };
}
