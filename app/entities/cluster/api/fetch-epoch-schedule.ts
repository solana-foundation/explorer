import { createSolanaRpc } from '@solana/kit';
import type { EpochSchedule } from '@utils/epoch-schedule';

export async function fetchEpochSchedule(url: string): Promise<EpochSchedule> {
    return createSolanaRpc(url).getEpochSchedule().send();
}
