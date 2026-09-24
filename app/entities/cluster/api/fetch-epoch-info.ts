import type { EpochInfo } from '../lib/types';
import { getRpc } from './get-rpc';

export async function fetchEpochInfo(url: string): Promise<EpochInfo> {
    return getRpc(url).getEpochInfo().send();
}
