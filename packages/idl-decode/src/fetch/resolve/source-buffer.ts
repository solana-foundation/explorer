// Buffer source — one explicit account, either family: @solana/idl reads the owner to tell a PMP buffer
// from the Anchor IdlAccount layout, so a single account read covers both.
import { fetchIdlFromBuffer, type SolanaRpcClient } from '@solana/idl';
import type { Address } from '@solana/kit';

import { type PublishedIdl, toPublishedIdl } from './solana-idl.js';

/**
 * Resolve the IDL an account holds directly — a PMP or Anchor buffer staged but not yet committed
 * (`anchor idl write-buffer`, PMP `write` before `setData`), or the committed account itself.
 * `undefined` when the account does not exist.
 */
export async function fetchBufferIdl(rpc: SolanaRpcClient, buffer: Address): Promise<PublishedIdl | undefined> {
    return toPublishedIdl(await fetchIdlFromBuffer(rpc, buffer));
}
