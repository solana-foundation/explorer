import { getU32Decoder, type ReadonlyUint8Array } from '@solana/kit';

import { MANGO_INSTRUCTION_NAMES } from './instruction-names';
import { MANGO_PROGRAM_IDS } from './program-ids';

const programIds = new Set<string>(Object.values(MANGO_PROGRAM_IDS));

export const isMangoProgramId = (programId: string): boolean => programIds.has(programId);

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

export const parseMangoInstructionTitle = (programId: string, data: ReadonlyUint8Array): string => {
    const title = resolveMangoInstructionName(programId, data);
    if (title === undefined) {
        throw new Error(`Unknown Mango instruction (${data.byteLength} bytes)`);
    }
    return title;
};

export { MANGO_PROGRAM_IDS };
