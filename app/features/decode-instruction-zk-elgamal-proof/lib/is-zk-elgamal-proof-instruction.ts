import type { TransactionInstruction } from '@solana/web3.js';

import { ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS } from './zk-elgamal-proof-parser';

/** Routes the tx-page byte path to the dispatcher-decoded card, alongside the other per-program guards. */
export function isZkElGamalProofInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS;
}
