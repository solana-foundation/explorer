import { type TransactionInstruction } from '@solana/web3.js';

import { DEPRECATED_SERUM_PROGRAM_IDS, SERUM_PROGRAM_IDS } from './program-ids';

const programIds = new Set<string>(SERUM_PROGRAM_IDS);
const deprecatedProgramIds = new Set<string>(DEPRECATED_SERUM_PROGRAM_IDS);

export const isSerumInstruction = (instruction: TransactionInstruction): boolean =>
    programIds.has(instruction.programId.toBase58());

export const isDeprecatedSerumProgram = (programId: string): boolean => deprecatedProgramIds.has(programId);

const SERUM_CODE_LOOKUP: { [key: number]: string } = {
    0: 'Initialize Market',
    1: 'New Order',
    10: 'New Order v3',
    11: 'Cancel Order v2',
    12: 'Cancel Order by Client Id v2',
    13: 'Send Take',
    14: 'Close Open Orders',
    15: 'Init Open Orders',
    16: 'Prune',
    17: 'Consume Events Permissioned',
    2: 'Match Orders',
    3: 'Consume Events',
    4: 'Cancel Order',
    5: 'Settle Funds',
    6: 'Cancel Order by Client Id',
    7: 'Disable Market',
    8: 'Sweep Fees',
    9: 'New Order v2',
};

// Serum keys its instructions by a version byte followed by a u32 LE instruction code.
const readInstructionCode = (data: Uint8Array): number =>
    new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(1, true);

export const parseSerumInstructionCode = (instruction: TransactionInstruction): number =>
    readInstructionCode(instruction.data);

// Name-only resolver for the NAME_SOURCES chain: program-id-gated and never throws, so it composes with other resolvers.
export const resolveSerumInstructionName = (programId: string, discriminator: Uint8Array): string | undefined => {
    if (!programIds.has(programId) || discriminator.byteLength < 5) return undefined;
    return SERUM_CODE_LOOKUP[readInstructionCode(discriminator)];
};

export const parseSerumInstructionTitle = (instruction: TransactionInstruction): string => {
    const title = resolveSerumInstructionName(instruction.programId.toBase58(), instruction.data);
    if (title === undefined) {
        throw new Error(
            instruction.data.byteLength < 5
                ? `Serum instruction data too short (${instruction.data.byteLength} bytes)`
                : `Unrecognized Serum instruction code: ${readInstructionCode(instruction.data)}`,
        );
    }
    return title;
};

// Guaranteed-string label for card titles; the resolver returns undefined when there's no readable code.
export const getSerumInstructionLabel = (instruction: TransactionInstruction): string =>
    resolveSerumInstructionName(instruction.programId.toBase58(), instruction.data) ??
    (instruction.data.length === 0 ? 'No data' : 'Unknown');

export { DEPRECATED_SERUM_PROGRAM_IDS, OPEN_BOOK_PROGRAM_IDS, SERUM_PROGRAM_IDS } from './program-ids';
