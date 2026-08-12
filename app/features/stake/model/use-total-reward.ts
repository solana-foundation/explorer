'use client';

import { useCluster } from '@entities/cluster';
import { isStakeTotalRewardEnabled } from '@entities/stake-rewards';
import { type Address } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';

export enum TotalRewardStatus {
    Disabled,
    Loading,
    Ready,
    Unavailable,
    Unsupported,
}

/**
 * The feature is off for this deployment, so there is no row at all.
 *
 * Named rather than inlined so callers can `Exclude` this exact shape once the row is dropped. Kept
 * apart from `Unavailable` because collapsing the two would print that message on every stake page
 * of an unprovisioned deployment, which reads as broken rather than as not-enabled-here.
 */
export type DisabledTotalRewardState = { status: TotalRewardStatus.Disabled };

/**
 * `Unsupported` and `Unavailable` are both a missing figure, split by who can act on it:
 * `Unsupported` is a cluster Solscan does not index, where nothing was ever requested, and
 * `Unavailable` is a request that was made and did not yield a total we can stand behind. The row
 * prints the same quiet message for both — and never a zero, which would be a claim about the
 * account rather than about the request.
 */
export type TotalRewardState =
    | DisabledTotalRewardState
    | { status: TotalRewardStatus.Loading }
    | { status: TotalRewardStatus.Ready; lamports: number }
    | { status: TotalRewardStatus.Unavailable }
    | { status: TotalRewardStatus.Unsupported };

/**
 * What one call to the route settled on: a total, or no total that repeating the call would change.
 * The fetcher resolves to this rather than throwing for a settled refusal, so SWR caches the answer
 * instead of retrying it.
 */
type SettledTotalReward = Extract<
    TotalRewardState,
    { status: TotalRewardStatus.Ready | TotalRewardStatus.Unavailable }
>;

/**
 * The route statuses worth asking again for: a rate limit resets, and a 502 or 504 is one bad
 * upstream call. Every other answer is settled for this address — 400 for a malformed address or a
 * non-mainnet cluster, 404 for a disabled deployment or a non-stake account, 503 for an
 * unconfigured key — and repeating the request cannot change it.
 */
const RETRYABLE_STATUSES = new Set([429, 502, 504]);

const ERROR_RETRY_COUNT = 3;

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
        // The retries apply to the retryable statuses alone — fetchTotalReward resolves rather than
        // throws for the settled ones, so a 400 is never asked again.
        { errorRetryCount: ERROR_RETRY_COUNT },
    );

    if (!isEnabled) {
        return { status: TotalRewardStatus.Disabled };
    }
    // Ahead of the request states: nothing was asked for, so there is no failure to report.
    if (!isSupported) {
        return { status: TotalRewardStatus.Unsupported };
    }
    // A retryable failure that ran out of retries. A settled refusal arrives as `data` instead.
    if (error) {
        return { status: TotalRewardStatus.Unavailable };
    }
    if (isLoading || data === undefined) {
        return { status: TotalRewardStatus.Loading };
    }
    return data;
}

/**
 * Throws only for the statuses a retry can still fix, and resolves to `Unavailable` for the rest, so
 * SWR's backoff is spent on the transient failures alone rather than on four identical requests for
 * an address the route has already refused.
 */
async function fetchTotalReward(stakeAccountAddress: Address): Promise<SettledTotalReward> {
    const response = await fetch(`/api/stake-rewards/${stakeAccountAddress}`);
    if (!response.ok) {
        if (RETRYABLE_STATUSES.has(response.status)) {
            throw new Error(`/api/stake-rewards returned ${response.status}`);
        }
        return { status: TotalRewardStatus.Unavailable };
    }
    const { totalReward } = await response.json();
    return { lamports: totalReward, status: TotalRewardStatus.Ready };
}
