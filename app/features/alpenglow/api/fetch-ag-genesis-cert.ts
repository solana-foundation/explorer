import { type ConnectableUrl } from '@entities/cluster';
import { createSolanaRpc, isSolanaError, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR } from '@solana/kit';

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

// Helius declines a method it does not serve with this, and kit throws on the status before the
// body saying so can be read.
const NOT_SERVED = 404;

// Observed against `explorer-api.mainnet-beta.solana.com`, which refuses this method with it while
// answering getEpochInfo from the same caller in the same second.
const RATE_LIMITED = 429;

// The endpoint will not serve this caller — typically a missing or wrong key on a custom RPC. The
// next request carries the same key, so retrying only spends it against the same wall.
const UNAUTHORIZED = [401, 403];

/**
 * Asks a node for the Alpenglow genesis certificate.
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
    let result;
    try {
        result = await createSolanaRpc(url)
            .getAgGenesisCert()
            // Without one, a connection accepted and never answered leaves the card waiting for good.
            .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    } catch (error) {
        const settled = classifyDecline(error);
        if (settled === undefined) throw error;
        return settled;
    }

    // The pre-migration answer, and the reason the method is worth polling at all.
    if (result === null) return { kind: 'absent' };

    try {
        return { cert: parseGenesisCert(result), kind: 'present' };
    } catch (cause) {
        // The node answered, and will answer the same way next time. Worth saying out loud —
        // a node minting a certificate this app cannot read is someone's bug.
        Logger.warn(`[alpenglow] ${METHOD} returned a result that is not a certificate`, { cause });
        return { kind: 'unreadable' };
    }
}

/**
 * The reply the endpoint will repeat, told apart from a failure worth another attempt. `undefined`
 * is the latter, and the caller rethrows it.
 */
function classifyDecline(error: unknown): AgGenesisCertAnswer | undefined {
    if (isMethodNotFound(asJsonRpcError(error))) return { kind: 'unsupported' };
    if (!isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) return undefined;

    const { statusCode } = error.context;
    if (statusCode === NOT_SERVED) return { kind: 'unsupported' };
    if (statusCode === RATE_LIMITED || UNAUTHORIZED.includes(statusCode)) {
        // Worth saying out loud, unlike `unsupported`: a limit can be raised and a key can be
        // fixed, so an endpoint refusing only this method is a configuration someone can change.
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
