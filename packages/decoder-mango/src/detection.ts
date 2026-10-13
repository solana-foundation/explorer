import { getU32Decoder, type Instruction, type InstructionWithData, type ReadonlyUint8Array } from '@solana/kit';

import { MANGO_INSTRUCTION_NAMES } from './instruction-names';
import { MANGO_PROGRAM_IDS } from './program-ids';

const programIds = new Set<string>(Object.values(MANGO_PROGRAM_IDS));

export const isMangoInstruction = (instruction: Instruction): boolean => programIds.has(instruction.programAddress);

// Mango keys its instructions by a leading u32 LE discriminator.
const readDiscriminator = (data: ReadonlyUint8Array): number => getU32Decoder().decode(data);

// Name-only resolver for the NAME_SOURCES chain: program-id-gated and never throws, so it composes with other resolvers.
export const resolveMangoInstructionName = (
    programId: string,
    discriminator: ReadonlyUint8Array,
): string | undefined => {
    if (!programIds.has(programId) || discriminator.byteLength < 4) return undefined;
    return MANGO_INSTRUCTION_NAMES.get(readDiscriminator(discriminator));
};

export const parseMangoInstructionTitle = (
    instruction: Instruction & InstructionWithData<ReadonlyUint8Array>,
): string => {
    const title = resolveMangoInstructionName(instruction.programAddress, instruction.data);
    if (title === undefined) {
        throw new Error(`Unknown Mango instruction (${instruction.data.byteLength} bytes)`);
    }
    return title;
};

// Guaranteed-string label for the deprecated card; the resolver returns undefined when there's no readable discriminator.
export const getMangoInstructionLabel = (instruction: Instruction & InstructionWithData<ReadonlyUint8Array>): string =>
    resolveMangoInstructionName(instruction.programAddress, instruction.data) ??
    (instruction.data.length === 0 ? 'No data' : 'Unknown');

export { MANGO_PROGRAM_IDS };
