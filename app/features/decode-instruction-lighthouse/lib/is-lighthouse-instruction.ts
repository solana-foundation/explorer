import type { TransactionInstruction } from '@solana/web3.js';

import { LIGHTHOUSE_ADDRESS } from './constants';

/**
 * Whether an instruction targets the Lighthouse program. Used by the tx-page
 * byte path to route to the dispatcher-decoded card, mirroring the per-program
 * guards (`isMangoInstruction`, `isPythInstruction`, …) it sits alongside.
 */
export function isLighthouseInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === LIGHTHOUSE_ADDRESS;
}
