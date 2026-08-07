'use client';

import { shouldUseDirectRpc } from '@entities/cluster';
import useSWRImmutable from 'swr/immutable';

import { useCluster } from '@/app/providers/cluster';
import { type Cluster } from '@/app/utils/cluster';

/**
 * `unavailable` covers every reason there is no figure to show — a failed request, an address the
 * route rejects, or a custom cluster the server cannot reach. The row renders the same quiet
 * message for all of them, and never a zero, which would be a claim about the account.
 */
export type TotalRewardState =
    | { status: 'loading' }
    | { status: 'ready'; lamports: number }
    | { status: 'unavailable' };

/**
 * A stake account's lifetime inflation-reward total, in lamports.
 *
 * The sweep costs one RPC call per epoch, so it runs on the server behind `/api/stake-rewards`,
 * which caches the response at the CDN and each epoch underneath. Custom and localhost clusters
 * have no server endpoint, so they skip the request rather than fail it.
 */
export function useTotalReward(stakeAccountAddress: string): TotalRewardState {
    const { cluster, url } = useCluster();
    const isCustom = shouldUseDirectRpc(cluster, url);

    const { data, error, isLoading } = useSWRImmutable(
        !isCustom && (['stake-total-reward', stakeAccountAddress, cluster] as const),
        () => fetchTotalReward(stakeAccountAddress, cluster),
        // fetchTotalReward throws rather than returning undefined, so cap the retries.
        { errorRetryCount: 3 },
    );

    if (isCustom || error) {
        return { status: 'unavailable' };
    }
    if (isLoading || data === undefined) {
        return { status: 'loading' };
    }
    return { lamports: data, status: 'ready' };
}

async function fetchTotalReward(stakeAccountAddress: string, cluster: Cluster): Promise<number> {
    const response = await fetch(`/api/stake-rewards/${stakeAccountAddress}?cluster=${cluster}`);
    if (!response.ok) {
        // Throw rather than return: a transient 502 should be retried, not cached as a successful
        // "no total" under useSWRImmutable, which never revalidates.
        throw new Error(`/api/stake-rewards returned ${response.status}`);
    }
    const { totalReward } = await response.json();
    return totalReward;
}
