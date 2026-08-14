// PMP leg — @solana/idl owns the lookup order (canonical PDA first, then the fndn fallback
// authority), the metadata decode and the url payload fetch.
import { fetchPmpIdl as resolvePmpIdl, type SolanaRpcClient } from '@solana/idl';
import type { Address } from '@solana/kit';

import { type PublishedIdl, toPublishedIdl } from './solana-idl.js';

/**
 * Resolve the program's PMP `idl` metadata; `undefined` when none is published. Pass an `authority`
 * to pin a single lookup — by default the canonical PDA is tried first, then the fndn fallback
 * authority (frozen programs have no upgrade authority, so canonical derivation cannot serve them).
 */
export async function fetchPmpIdl(
    rpc: SolanaRpcClient,
    program: Address,
    authority: Address | null | undefined,
): Promise<PublishedIdl | undefined> {
    return toPublishedIdl(await resolvePmpIdl(rpc, program, { authority }));
}
