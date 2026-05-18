import { PublicKey } from '@solana/web3.js';
import { LOADER_IDS, PROGRAM_INFO_BY_ID } from '@utils/programs';

export function getProgramName(programId: PublicKey): string {
    const address = programId.toBase58();
    return PROGRAM_INFO_BY_ID[address]?.name ?? LOADER_IDS[address] ?? 'Unknown';
}
