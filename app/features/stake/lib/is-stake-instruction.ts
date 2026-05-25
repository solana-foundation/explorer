import type { TransactionInstruction } from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';

export function isStakeInstruction(instruction: TransactionInstruction): boolean {
    return instruction.programId.toBase58() === STAKE_PROGRAM_ADDRESS;
}
