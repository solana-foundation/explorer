'use client';

import { type ConnectableUrl, shouldUseDirectRpc, useCluster } from '@entities/cluster/@x/slot-time';
import { type Cluster } from '@utils/cluster';
import useSWR from 'swr';

import { fetchSlotTimeFromRoute, fetchSlotTimeFromRpc, isRetryableSlotTimeError } from '../api/fetch-slot-time';

// Capped, because an endpoint that has failed this often will not answer on the next try either.
export const ERROR_RETRY_COUNT = 3;

/**
 * Measured milliseconds per slot on the active cluster, or `undefined` until one is in hand.
 *
 * Undefined while loading and after a failure alike: a caller estimating a duration from slots has
 * nothing honest to fall back on. Every cluster steps its own way through the SIMD-0525 gates, so a
 * constant is wrong on some cluster whatever it is set to.
 *
 * `enabled: false` defers the request, for a caller that already knows it will render no duration —
 * on a custom cluster that request would reach the visitor's own node for nothing.
 */
export function useSlotTime({ enabled = true }: { enabled?: boolean } = {}): number | undefined {
    const { cluster, connectableUrl } = useCluster();

    const direct = connectableUrl !== undefined && shouldUseDirectRpc(cluster, connectableUrl);

    // A falsy key waits, which is what an unsettled custom URL should do. The endpoint belongs in the
    // key because a known cluster can still point somewhere local.
    const { data } = useSWR(
        enabled && connectableUrl && (['slot-time', cluster, connectableUrl] as const),
        ([, keyCluster, endpoint]: readonly ['slot-time', Cluster, ConnectableUrl]) =>
            shouldUseDirectRpc(keyCluster, endpoint)
                ? fetchSlotTimeFromRpc(endpoint)
                : fetchSlotTimeFromRoute(keyCluster),
        {
            errorRetryCount: ERROR_RETRY_COUNT,
            // Refreshing costs nothing behind the cache. A visitor's own node answers every time it is
            // asked, and the rate it reports moves only when a feature gate activates.
            revalidateIfStale: !direct,
            revalidateOnFocus: !direct,
            revalidateOnReconnect: !direct,
            // Never at the visitor's own node, and elsewhere only what could answer differently: a
            // refusal repeats, and every repeat would report it again.
            shouldRetryOnError: direct ? false : isRetryableSlotTimeError,
        },
    );

    return data;
}
