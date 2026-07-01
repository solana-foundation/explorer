import { type TransactionInstruction } from '@solana/web3.js';

import { MANGO_INSTRUCTION_NAMES } from './instruction-names';
import { MANGO_PROGRAM_IDS } from './program-ids';

const programIds = new Set(Object.values(MANGO_PROGRAM_IDS).map(id => id.toBase58()));

export const isMangoInstruction = (instruction: TransactionInstruction): boolean =>
    programIds.has(instruction.programId.toBase58());

// Mango keys its instructions by a leading u32 LE discriminator.
const readDiscriminator = (data: Uint8Array): number =>
    new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0, true);

// Name-only resolver for the NAME_SOURCES chain: program-id-gated and never throws, so it composes with other resolvers.
export const resolveMangoInstructionName = (programId: string, discriminator: Uint8Array): string | undefined => {
    if (!programIds.has(programId) || discriminator.byteLength < 4) return undefined;
    return MANGO_INSTRUCTION_NAMES.get(readDiscriminator(discriminator));
};

export const parseMangoInstructionTitle = (instruction: TransactionInstruction): string => {
    const title = resolveMangoInstructionName(instruction.programId.toBase58(), instruction.data);
    if (title === undefined) {
        throw new Error(`Unknown Mango instruction (${instruction.data.byteLength} bytes)`);
    }
    return title;
};

// Guaranteed-string label for the deprecated card; the resolver returns undefined when there's no readable discriminator.
export const getMangoInstructionLabel = (instruction: TransactionInstruction): string =>
    resolveMangoInstructionName(instruction.programId.toBase58(), instruction.data) ??
    (instruction.data.length === 0 ? 'No data' : 'Unknown');

export { MANGO_PROGRAM_IDS };
