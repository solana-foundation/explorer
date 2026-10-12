import type { TransactionInstruction } from '@solana/web3.js';

import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from './compute-budget-parser';

/** Routes the tx-page byte path to the dispatcher-decoded card, alongside the other per-program guards. */
export function isComputeBudgetInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === COMPUTE_BUDGET_PROGRAM_ADDRESS;
}
