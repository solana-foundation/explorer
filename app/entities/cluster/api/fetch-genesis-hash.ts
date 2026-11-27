import { type GenesisHash, GenesisHashFromString } from '@entities/chain-id/@x/cluster';
import { createSolanaRpc } from '@solana/kit';
import { create } from 'superstruct';

import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

// A single cheap call that both proves the RPC is reachable and resolves the chain identity.
export async function fetchGenesisHash(url: string): Promise<GenesisHash> {
    // A node that accepts the connection and never answers would otherwise hold the cluster at
    // `Connecting`, and every hook keyed on that status waits there with it.
    const genesisHash = await createSolanaRpc(url)
        .getGenesisHash()
        .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    return create(genesisHash, GenesisHashFromString);
}
