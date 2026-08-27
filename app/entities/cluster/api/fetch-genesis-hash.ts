import { createSolanaRpc } from '@solana/kit';

import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

// A single cheap call that both proves the RPC is reachable and resolves the chain identity.
export async function fetchGenesisHash(url: string): Promise<string> {
    // A node that accepts the connection and never answers would otherwise hold the cluster at
    // `Connecting`, and every hook keyed on that status waits there with it.
    return createSolanaRpc(url)
        .getGenesisHash()
        .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
}
