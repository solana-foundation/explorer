import { getRpc } from './get-rpc';

export async function fetchFirstAvailableBlock(url: string): Promise<bigint> {
    return getRpc(url).getFirstAvailableBlock().send();
}
