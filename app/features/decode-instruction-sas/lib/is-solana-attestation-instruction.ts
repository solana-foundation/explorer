import type { TransactionInstruction } from '@solana/web3.js';

import { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS } from './sas-parser';

/** Routes the tx-page byte path to the dispatcher-decoded card, alongside the other per-program guards. */
export function isSolanaAttestationInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS;
}
