import { createSolanaRpc } from '@solana/kit';

// A single cheap call that both proves the RPC is reachable and resolves the chain identity.
export async function fetchGenesisHash(url: string): Promise<string> {
    return createSolanaRpc(url).getGenesisHash().send();
}
