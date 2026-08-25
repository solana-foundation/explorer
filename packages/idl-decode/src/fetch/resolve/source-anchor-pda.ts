// Anchor leg — @solana/idl owns the IDL PDA derivation, the account layout and the inflate.
import { fetchAnchorIdl, type SolanaRpcClient } from '@solana/idl';
import type { Address } from '@solana/kit';

import { type PublishedIdl, toPublishedIdl } from './solana-idl.js';

/** Resolve the program's Anchor IDL PDA account; `undefined` when none exists. */
export async function fetchAnchorPdaIdl(rpc: SolanaRpcClient, program: Address): Promise<PublishedIdl | undefined> {
    return toPublishedIdl(await fetchAnchorIdl(rpc, program));
}
