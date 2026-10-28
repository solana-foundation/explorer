import 'client-only';

import { useCluster } from '@providers/cluster';
import { address } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';

import { fetchVestingLocks } from '../api/fetch-vesting-locks';

// Genesis is deployed on mainnet and devnet; a custom URL may point at either or at a local validator.
const ENABLED_CLUSTERS = new Set([Cluster.MainnetBeta, Cluster.Devnet, Cluster.Custom]);

type HookOptions = {
    /**
     * Refetch when a component mounts with cached locks. The Vesting page sets it, so a lock claimed, paused or
     * cancelled since the last visit shows its new state. The tab-visibility check runs on every mint page and
     * keeps the session cache; it shares the key, so each page refetch updates it too.
     */
    revalidateIfStale?: boolean;
};

export function useVestingLocks(mint: string | undefined, options?: HookOptions) {
    const { cluster, url } = useCluster();

    return useSWR(
        mint !== undefined && ENABLED_CLUSTERS.has(cluster)
            ? (['genesis-vesting-locks', mint, url] as const)
            : undefined,
        ([_prefix, mintAddress, rpcUrl]) => fetchVestingLocks(rpcUrl, address(mintAddress)),
        // Locks change only through transactions, so focus and reconnect do not refetch them.
        {
            revalidateIfStale: options?.revalidateIfStale ?? false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );
}
