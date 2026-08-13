import { createSolanaRpc } from '@solana/kit';

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;

const rpcByUrl = new Map<string, SolanaRpc>();

// One rpc client per endpoint. The client is a stateless transport wrapper, so every caller can share
// it, and the stable identity lets React hooks and effects depend on the rpc without re-firing.
export function getRpc(url: string): SolanaRpc {
    let rpc = rpcByUrl.get(url);
    if (!rpc) {
        rpc = createSolanaRpc(url);
        rpcByUrl.set(url, rpc);
    }
    return rpc;
}
