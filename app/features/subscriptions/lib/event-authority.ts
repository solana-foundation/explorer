import { address } from '@solana/kit';
import { findEventAuthorityPda } from '@solana/subscriptions';

import { SUBSCRIPTIONS_ADDRESS } from './constants';

/**
 * Derives the Subscriptions program's event-authority PDA.
 *
 * The event authority is a signer-only PDA (`type EventAuthority = {}`) used to sign
 * emitted program events. It carries no account data and is typically never allocated
 * on-chain, so it cannot be recognised by decoding account bytes — only by matching
 * this derived address. The result is constant for a given program.
 */
export async function deriveEventAuthorityAddress(): Promise<string> {
    const [pda] = await findEventAuthorityPda({ programAddress: address(SUBSCRIPTIONS_ADDRESS) });
    return pda;
}
