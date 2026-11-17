import { getOwn } from '@shared/lib/object';
import { PublicKey } from '@solana/web3.js';
import { LOADER_IDS, PROGRAM_INFO_BY_ID } from '@utils/programs';

export const UNKNOWN_PROGRAM_NAME = 'Unknown Program';

// Falls back to the given label (default "Unknown Program") when no name is known.
export function getProgramName(programId: PublicKey, fallback: string = UNKNOWN_PROGRAM_NAME): string {
    return findProgramName(programId) ?? fallback;
}

// Undefined when no name is known — for callers that render their own fallback instead of a label.
export function findProgramName(programId: PublicKey): string | undefined {
    const address = programId.toBase58();
    return getOwn(PROGRAM_INFO_BY_ID, address)?.name ?? getOwn(LOADER_IDS, address);
}
