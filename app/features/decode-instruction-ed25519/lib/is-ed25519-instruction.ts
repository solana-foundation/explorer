import type { TransactionInstruction } from '@solana/web3.js';

import { ED25519_PROGRAM_ADDRESS } from './ed25519-parser';

/** Routes the tx-page byte path to the dispatcher-decoded card, alongside the other per-program guards. */
export function isEd25519Instruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === ED25519_PROGRAM_ADDRESS;
}
