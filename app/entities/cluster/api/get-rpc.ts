// Deliberately no 'use client': route handlers call this too, and the directive turns those calls
// into a client-reference error at runtime.
import {
    createDefaultRpcTransport,
    createSolanaRpc,
    createSolanaRpcFromTransport,
    type Rpc,
    type SolanaRpcApi,
} from '@solana/kit';

// Not `ReturnType<typeof createSolanaRpc>`: that resolves against the branded-cluster-URL overload
// and yields a union that no narrower rpc parameter accepts.
export type SolanaRpc = Rpc<SolanaRpcApi>;

// Derived rather than imported: `RpcTransport` lives in `@solana/rpc-spec`, which the app does not
// depend on directly, and `@solana/kit` re-exports the factory but not the type.
type SolanaRpcTransport = ReturnType<typeof createDefaultRpcTransport<string>>;

// Generous bound relative to real usage (a handful of known clusters plus the occasional custom URL);
// it only exists so free-form custom endpoints can't grow the cache without limit.
export const MAX_CACHED_RPCS = 25;

const rpcByUrl = new Map<string, SolanaRpc>();

// One rpc client per endpoint. The client is a stateless transport wrapper, so every caller can share
// it, and the stable identity lets React hooks and effects depend on the rpc without re-firing.
// A cached URL is a pure read, so calling this during render never reorders or evicts anything.
export function getRpc(url: string): SolanaRpc {
    const cached = rpcByUrl.get(url);
    if (cached) return cached;

    const rpc = createSolanaRpc(url);
    if (rpcByUrl.size >= MAX_CACHED_RPCS) {
        // Map iteration order is insertion order, so this drops the oldest entry.
        rpcByUrl.delete(rpcByUrl.keys().next().value as string);
    }
    rpcByUrl.set(url, rpc);
    return rpc;
}

/**
 * A client whose every request carries `abortSignal`, with the same defaults as `createSolanaRpc(url)`.
 *
 * Deliberately uncached, unlike `getRpc`: a signal belongs to one caller's deadline, not to an endpoint.
 * @param url - The RPC endpoint
 * @param abortSignal - Fires on the caller's deadline, cancelling every request this client has in flight
 */
export function createAbortableRpc(url: string, abortSignal: AbortSignal): SolanaRpc {
    return createSolanaRpcFromTransport(withAbortSignal(createDefaultRpcTransport<string>({ url }), abortSignal));
}

/** A transport that adds `abortSignal` to every request, keeping any signal the request already carried. */
export function withAbortSignal(transport: SolanaRpcTransport, abortSignal: AbortSignal): SolanaRpcTransport {
    return config =>
        transport({
            ...config,
            signal: config.signal ? AbortSignal.any([config.signal, abortSignal]) : abortSignal,
        });
}
