import { PublicKey } from '@solana/web3.js';
import { LOADER_IDS, PROGRAM_INFO_BY_ID } from '@utils/programs';

// Falls back to the given label (default "Unknown Program") when no name is known.
export function getProgramName(programId: PublicKey, fallback = 'Unknown Program'): string {
    const address = programId.toBase58();
    return PROGRAM_INFO_BY_ID[address]?.name ?? LOADER_IDS[address] ?? fallback;
}
