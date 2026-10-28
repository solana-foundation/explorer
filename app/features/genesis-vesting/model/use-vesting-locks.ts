import 'client-only';

import { useCluster } from '@providers/cluster';
import { address } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import useSWRImmutable from 'swr/immutable';

import { fetchVestingLocks } from '../api/fetch-vesting-locks';

// Genesis is deployed on mainnet and devnet; a custom URL may point at either or at a local validator.
const ENABLED_CLUSTERS = new Set([Cluster.MainnetBeta, Cluster.Devnet, Cluster.Custom]);

type HookOptions = {
    /**
     * `true` (default) throws to the nearest ErrorBoundary, for the Vesting page. The tab-visibility check runs
     * on every mint page, so it passes `false` and hides the tab on an RPC error instead.
     */
    suspense?: boolean;
};

export function useVestingLocks(mint: string | undefined, options?: HookOptions) {
    const { cluster, url } = useCluster();

    return useSWRImmutable(
        mint !== undefined && ENABLED_CLUSTERS.has(cluster)
            ? (['genesis-vesting-locks', mint, url] as const)
            : undefined,
        ([_prefix, mintAddress, rpcUrl]) => fetchVestingLocks(rpcUrl, address(mintAddress)),
        { suspense: options?.suspense ?? true },
    );
}
