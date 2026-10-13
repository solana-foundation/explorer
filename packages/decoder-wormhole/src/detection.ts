import { getU8Decoder, type Instruction, type InstructionWithData, type ReadonlyUint8Array } from '@solana/kit';

import { WORMHOLE_INSTRUCTION_NAMES } from './instruction-names';
import { WORMHOLE_PROGRAM_IDS } from './program-ids';

const programIds = new Set<string>(WORMHOLE_PROGRAM_IDS);

export const isWormholeInstruction = (instruction: Instruction): boolean => programIds.has(instruction.programAddress);

// Wormhole keys its instructions by a leading u8 tag.
const readTag = (data: ReadonlyUint8Array): number => getU8Decoder().decode(data);

// Name-only resolver for the NAME_SOURCES chain: program-id-gated and never throws, so it composes with other resolvers.
export const resolveWormholeInstructionName = (
    programId: string,
    discriminator: ReadonlyUint8Array,
): string | undefined => {
    if (!programIds.has(programId) || discriminator.byteLength < 1) return undefined;
    return WORMHOLE_INSTRUCTION_NAMES.get(readTag(discriminator));
};

export const parseWormholeInstructionTitle = (
    instruction: Instruction & InstructionWithData<ReadonlyUint8Array>,
): string => {
    const title = resolveWormholeInstructionName(instruction.programAddress, instruction.data);
    if (title === undefined) {
        throw new Error(
            instruction.data.byteLength < 1
                ? 'Wormhole instruction has no data'
                : `Unrecognized Wormhole instruction code: ${readTag(instruction.data)}`,
        );
    }
    return title;
};

export { WORMHOLE_PROGRAM_IDS };
