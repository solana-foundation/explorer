'use client';

import { useCluster } from '@entities/cluster';
import { isStakeTotalRewardEnabled } from '@entities/stake-rewards';
import { type Address } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';

/**
 * `unavailable` covers every reason the figure could not be fetched — a failed request, a cluster
 * Solscan does not index, or an unconfigured key. The row renders the same quiet message for all of
 * them, and never a zero, which would be a claim about the account.
 *
 * `disabled` is separate: the feature is not turned on for this deployment, so there is no row at
 * all. Collapsing the two would render `Unavailable` on every stake page of an unprovisioned
 * deployment, which reads as broken rather than as not-enabled-here.
 */
export type TotalRewardState =
    | { status: 'disabled' }
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
    const isEnabled = isStakeTotalRewardEnabled();
    // Solscan indexes mainnet-beta only, so other clusters skip the request rather than fail it.
    const isSupported = cluster === Cluster.MainnetBeta;

    const { data, error, isLoading } = useSWR(
        // A falsy key disables the fetch, so a disabled deployment never asks for the total.
        isEnabled && isSupported && (['stake-total-reward', stakeAccountAddress] as const),
        () => fetchTotalReward(stakeAccountAddress),
        // Revalidating (rather than `useSWRImmutable`) keeps a long-lived tab from showing a total
        // frozen from before the last epoch boundary. It costs no upstream quota: a revalidation
        // inside the route's 4 h CDN window is served by the CDN and never reaches Solscan.
        //
        // fetchTotalReward throws rather than returning undefined, so cap the retries.
        { errorRetryCount: 3 },
    );

    if (!isEnabled) {
        return { status: 'disabled' };
    }
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
