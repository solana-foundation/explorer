import { type TransactionInstruction } from '@solana/web3.js';

import { MANGO_PROGRAM_IDS } from './program-ids';

const programIds = new Set(Object.values(MANGO_PROGRAM_IDS).map(id => id.toBase58()));

export const isMangoInstruction = (instruction: TransactionInstruction): boolean =>
    programIds.has(instruction.programId.toBase58());

export { MANGO_PROGRAM_IDS };
