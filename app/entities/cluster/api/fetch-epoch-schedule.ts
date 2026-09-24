import type { EpochSchedule } from '@utils/epoch-schedule';

import { getRpc } from './get-rpc';

export async function fetchEpochSchedule(url: string): Promise<EpochSchedule> {
    return getRpc(url).getEpochSchedule().send();
}
