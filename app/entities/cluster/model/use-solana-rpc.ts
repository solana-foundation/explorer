'use client';

import { getRpc, type SolanaRpc } from '../api/get-rpc';
import { useCluster } from './use-cluster';

// The rpc client for the active cluster. Stable per cluster URL (see getRpc), so it is safe to use
// directly in hook dependency arrays.
export function useSolanaRpc(): SolanaRpc {
    const { url } = useCluster();
    return getRpc(url);
}
