'use client';

import { type ConnectableUrl, getRpc, useCluster } from '@entities/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { useCallback } from 'react';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

type ActivatedStake = Readonly<{ activatedStake: bigint }>;

/**
 * Activated stake, in lamports. Delinquent stake is counted inside the active total.
 *
 * Plain bigints, not kit's `Lamports`: these are sums, and a sum of u64 amounts need not fit in one, so
 * nothing here has been range-checked.
 */
export type Stake = Readonly<{
    active: bigint;
    delinquent: bigint;
}>;

/** `retry` sits on `failed` alone, so there is no button where there is nothing to re-ask. */
export type VoteAccountsState =
    { kind: 'loading' } | { kind: 'failed'; retry: () => void } | { kind: 'ready'; stake: Stake };

/** Keyed by cluster and endpoint, so switching either drops figures that belonged to the old one. */
export function useVoteAccounts(): VoteAccountsState {
    const { cluster, connectableUrl, status } = useCluster();

    // A heavy call, so it waits for the health check rather than racing it. A *failed* check still asks:
    // a disabled key has nothing to revalidate, which would leave the retry below doing nothing.
    const { data, error, mutate } = useSWRImmutable(
        status !== ClusterStatus.Connecting && connectableUrl && (['vote-accounts', cluster, connectableUrl] as const),
        ([, , endpoint]: readonly ['vote-accounts', Cluster, ConnectableUrl]) => fetchStake(endpoint),
        {
            onError: fetchError => {
                // No server sees this one, so nobody hears about it unless we say so. A custom endpoint
                // still says nothing: that URL is the visitor's own and may carry their key.
                //
                // Warning, not error: this fires from the browser, once per visitor, with no CDN in front
                // of it, so one slow cluster would otherwise set the error rate on its own. Classifying
                // instead would be better, and costs 60 kB of `@solana/idl` in this bundle to do.
                if (cluster !== Cluster.Custom) {
                    Logger.warn('[vote] getVoteAccounts failed', {
                        sentry: true,
                        // In the browser only `sentryExtras` leaves the process, so a plain field here
                        // would report an event with no reason attached.
                        sentryExtras: {
                            cluster,
                            rpcError: fetchError instanceof Error ? fetchError.message : String(fetchError),
                            url: connectableUrl,
                        },
                    });
                }
            },
            // A down node must not be hammered while the tab sits open. `failed` carries the retry.
            shouldRetryOnError: false,
        },
    );

    const retry = useCallback(() => {
        void mutate();
    }, [mutate]);

    // Before `error`, because figures in hand beat a failed refetch.
    if (data !== undefined) {
        return { kind: 'ready', stake: data };
    }
    if (error) {
        return { kind: 'failed', retry };
    }
    return { kind: 'loading' };
}

/** Sums at the boundary, so the account lists never reach a component. */
export function totalStake({
    current,
    delinquent,
}: {
    current: readonly ActivatedStake[];
    delinquent: readonly ActivatedStake[];
}): Stake {
    const delinquentStake = sumActivatedStake(delinquent);

    return { active: sumActivatedStake(current) + delinquentStake, delinquent: delinquentStake };
}

async function fetchStake(url: ConnectableUrl): Promise<Stake> {
    // Without a deadline, a node that accepts the connection and never answers leaves the card spinning.
    const accounts = await getRpc(url)
        .getVoteAccounts({ commitment: 'confirmed' })
        .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

    return totalStake(accounts);
}

function sumActivatedStake(accounts: readonly ActivatedStake[]): bigint {
    return accounts.reduce((total, account) => total + account.activatedStake, 0n);
}
