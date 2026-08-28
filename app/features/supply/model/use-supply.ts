'use client';

import { type ConnectableUrl, shouldUseDirectRpc, useCluster } from '@entities/cluster';
import { Cluster } from '@utils/cluster';
import { useCallback } from 'react';
import useSWR from 'swr';

import { Logger } from '@/app/shared/lib/logger';

import { fetchSupplyFromRoute, fetchSupplyFromRpc, isRetryableSupplyError } from '../api/fetch-supply';
import { type Supply } from '../lib/supply';

/** `unavailable` is an answer no retry can change, so nothing offers a button for it. */
export type SupplyState =
    | { kind: 'loading' }
    | { kind: 'failed'; retry: () => void }
    | { kind: 'unavailable' }
    | { kind: 'ready'; supply: Supply };

// Capped, because an endpoint that has failed this often will not answer on the next try either.
export const ERROR_RETRY_COUNT = 3;

/** Starts on mount rather than waiting for the cluster health check. */
export function useSupply(): SupplyState {
    const { cluster, connectableUrl } = useCluster();

    // Which endpoint answers also decides what asking again costs, so the config below needs it too.
    const direct = connectableUrl !== undefined && shouldUseDirectRpc(cluster, connectableUrl);

    // A falsy key waits, which is what an unsettled custom URL should do. The endpoint belongs in the
    // key because a known cluster can still point somewhere local.
    const { data, error, mutate } = useSWR(
        connectableUrl && (['supply', cluster, connectableUrl] as const),
        ([, keyCluster, endpoint]: readonly ['supply', Cluster, ConnectableUrl]) =>
            shouldUseDirectRpc(keyCluster, endpoint) ? fetchSupplyFromRpc(endpoint) : fetchSupplyFromRoute(keyCluster),
        {
            errorRetryCount: ERROR_RETRY_COUNT,
            onError: fetchError => {
                // The direct path alone: no route saw it, so nobody hears about it unless we say so. The
                // route reports its own, and a custom endpoint stays out of it — that URL is the
                // visitor's own and may carry their key.
                if (direct && cluster !== Cluster.Custom) {
                    Logger.error(fetchError, {
                        sentry: true,
                        // In the browser only `sentryExtras` leaves the process, so a plain field here
                        // would report an event with no reason attached.
                        sentryExtras: {
                            cluster,
                            rpcError: fetchError instanceof Error ? fetchError.message : String(fetchError),
                        },
                    });
                }
            },
            // Refreshing costs nothing behind the cache and keeps a long-lived tab honest. Asking a node
            // directly costs a ledger scan every time, so it is asked once.
            revalidateIfStale: !direct,
            revalidateOnFocus: !direct,
            revalidateOnReconnect: !direct,
            // Same trade: retry only what could answer differently, and never at the visitor's own node.
            shouldRetryOnError: direct ? false : isRetryableSupplyError,
        },
    );

    const retry = useCallback(() => {
        void mutate();
    }, [mutate]);

    // Before `error`, because a figure in hand beats a failed refresh.
    if (data !== undefined) {
        return { kind: 'ready', supply: data };
    }
    // Only the route classifies its failures, so the direct path never reaches `unavailable`.
    if (error) {
        return isRetryableSupplyError(error) ? { kind: 'failed', retry } : { kind: 'unavailable' };
    }
    return { kind: 'loading' };
}
