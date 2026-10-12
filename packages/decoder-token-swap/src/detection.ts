import { getU8Decoder } from '@solana/kit';
import { type TransactionInstruction } from '@solana/web3.js';

import { TOKEN_SWAP_INSTRUCTION_NAMES } from './instruction-names';
import { TOKEN_SWAP_PROGRAM_IDS } from './program-ids';

const programIds = new Set<string>(TOKEN_SWAP_PROGRAM_IDS);

export const isTokenSwapInstruction = (instruction: TransactionInstruction): boolean =>
    programIds.has(instruction.programId.toBase58());

// Token Swap keys its instructions by a leading u8 tag.
const readTag = (data: Uint8Array): number => getU8Decoder().decode(data);

// Name-only resolver for the NAME_SOURCES chain: program-id-gated and never throws, so it composes with other resolvers.
export const resolveTokenSwapInstructionName = (programId: string, discriminator: Uint8Array): string | undefined => {
    if (!programIds.has(programId) || discriminator.byteLength < 1) return undefined;
    return TOKEN_SWAP_INSTRUCTION_NAMES.get(readTag(discriminator));
};

export const parseTokenSwapInstructionTitle = (instruction: TransactionInstruction): string => {
    const title = resolveTokenSwapInstructionName(instruction.programId.toBase58(), instruction.data);
    if (title === undefined) {
        throw new Error(
            instruction.data.byteLength < 1
                ? 'Token Swap instruction has no data'
                : `Unrecognized Token Swap instruction code: ${readTag(instruction.data)}`,
        );
    }
    return title;
};

export { TOKEN_SWAP_PROGRAM_IDS };
