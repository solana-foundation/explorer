'use client';

import { useCluster } from '@entities/cluster';
import { type Address } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import useSWRImmutable from 'swr/immutable';

/**
 * `unavailable` covers every reason there is no figure to show — a failed request, a cluster
 * Solscan does not index, or an unconfigured key. The row renders the same quiet message for all of
 * them, and never a zero, which would be a claim about the account.
 */
export type TotalRewardState =
    | { status: 'loading' }
    | { status: 'ready'; lamports: number }
    | { status: 'unavailable' };

/**
 * A stake account's lifetime inflation-reward total, in lamports.
 *
 * The sum runs on the server behind `/api/stake-rewards`, which holds the Solscan key and shares one
 * paged sweep across visitors through the CDN.
 */
export function useTotalReward(stakeAccountAddress: Address): TotalRewardState {
    const { cluster } = useCluster();
    // Solscan indexes mainnet-beta only, so other clusters skip the request rather than fail it.
    const isSupported = cluster === Cluster.MainnetBeta;

    const { data, error, isLoading } = useSWRImmutable(
        isSupported && (['stake-total-reward', stakeAccountAddress] as const),
        () => fetchTotalReward(stakeAccountAddress),
        // fetchTotalReward throws rather than returning undefined, so cap the retries.
        { errorRetryCount: 3 },
    );

    if (!isSupported || error) {
        return { status: 'unavailable' };
    }
    if (isLoading || data === undefined) {
        return { status: 'loading' };
    }
    return { lamports: data, status: 'ready' };
}

async function fetchTotalReward(stakeAccountAddress: Address): Promise<number> {
    const response = await fetch(`/api/stake-rewards/${stakeAccountAddress}`);
    if (!response.ok) {
        // Throw rather than return: a transient 502 should be retried, not cached as a successful
        // "no total" under useSWRImmutable, which never revalidates.
        throw new Error(`/api/stake-rewards returned ${response.status}`);
    }
    const { totalReward } = await response.json();
    return totalReward;
}
