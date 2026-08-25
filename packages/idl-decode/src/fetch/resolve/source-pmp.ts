// PMP leg — @solana/idl owns the lookup order (canonical PDA first, then the fndn fallback
// authority), the metadata decode and the url payload fetch.
import { fetchPmpIdl as resolvePmpIdl, type SolanaRpcClient } from '@solana/idl';
import type { Address } from '@solana/kit';

import { type PublishedIdl, toPublishedIdl } from './solana-idl.js';

/**
 * Resolve the program's PMP `idl` metadata; `undefined` when none is published. Pass an `authority`
 * to pin a single lookup — by default the canonical PDA is tried first, then the fndn fallback
 * authority.
 *
 * This is the one leg where upstream reports `payload` for a failed *read or download* as well as for
 * unusable bytes — it catches every non-`SolanaError` throw — so that reason stays retryable here.
 */
export async function fetchPmpIdl(
    rpc: SolanaRpcClient,
    program: Address,
    authority: Address | null | undefined,
): Promise<PublishedIdl | undefined> {
    return toPublishedIdl(await resolvePmpIdl(rpc, program, { authority }), { retryablePayload: true });
}
