import { getU8Decoder, type ReadonlyUint8Array } from '@solana/kit';

import { TOKEN_SWAP_INSTRUCTION_NAMES } from './instruction-names';
import { TOKEN_SWAP_PROGRAM_IDS } from './program-ids';

const programIds = new Set<string>(TOKEN_SWAP_PROGRAM_IDS);

export const isTokenSwapProgramId = (programId: string): boolean => programIds.has(programId);

// Token Swap keys its instructions by a leading u8 tag.
const readTag = (data: ReadonlyUint8Array): number => getU8Decoder().decode(data);

// Name-only resolver for the NAME_SOURCES chain: program-id-gated and never throws, so it composes with other resolvers.
export const resolveTokenSwapInstructionName = (
    programId: string,
    discriminator: ReadonlyUint8Array,
): string | undefined => {
    if (!programIds.has(programId) || discriminator.byteLength < 1) return undefined;
    return TOKEN_SWAP_INSTRUCTION_NAMES.get(readTag(discriminator));
};

export const parseTokenSwapInstructionTitle = (programId: string, data: ReadonlyUint8Array): string => {
    const title = resolveTokenSwapInstructionName(programId, data);
    if (title === undefined) {
        throw new Error(
            data.byteLength < 1
                ? 'Token Swap instruction has no data'
                : `Unrecognized Token Swap instruction code: ${readTag(data)}`,
        );
    }
    return title;
};

export { TOKEN_SWAP_PROGRAM_IDS };
