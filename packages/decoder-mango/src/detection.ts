import { type TransactionInstruction } from '@solana/web3.js';

import { MANGO_INSTRUCTION_NAMES } from './instruction-names';
import { MANGO_PROGRAM_IDS } from './program-ids';

const programIds = new Set(Object.values(MANGO_PROGRAM_IDS).map(id => id.toBase58()));

export const isMangoInstruction = (instruction: TransactionInstruction): boolean =>
    programIds.has(instruction.programId.toBase58());

export const parseMangoInstructionTitle = (instruction: TransactionInstruction): string => {
    const { buffer, byteOffset, byteLength } = instruction.data;
    // Mango instruction data is a buffer-layout union keyed by a leading u32 LE discriminator.
    const variant = new DataView(buffer, byteOffset, byteLength).getUint32(0, true);
    const title = MANGO_INSTRUCTION_NAMES.get(variant);
    if (title === undefined) {
        throw new Error(`Unknown Mango instruction variant: ${variant}`);
    }
    return title;
};

export { MANGO_PROGRAM_IDS };
