import { createSolanaRpc } from '@solana/kit';

import type { ClusterInfo } from '../lib/types';

// Live ledger info (epoch, schedule, first block), fetched on demand by useClusterInfo() —
// separate from the connection health check, which only needs the genesis hash.
export async function fetchClusterInfo(url: string): Promise<ClusterInfo> {
    const rpc = createSolanaRpc(url);
    const [firstAvailableBlock, epochSchedule, epochInfo] = await Promise.all([
        rpc.getFirstAvailableBlock().send(),
        rpc.getEpochSchedule().send(),
        rpc.getEpochInfo().send(),
    ]);
    return {
        epochInfo,
        epochSchedule,
        firstAvailableBlock,
    };
}
