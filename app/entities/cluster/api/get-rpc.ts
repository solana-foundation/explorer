'use client';

import { createSolanaRpc } from '@solana/kit';

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;

// Generous bound relative to real usage (a handful of known clusters plus the occasional custom URL);
// it only exists so free-form custom endpoints can't grow the cache for the life of the tab.
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
