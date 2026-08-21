'use client';

import { useClusterConnectionFailed } from '@entities/cluster';

import { type CacheEntry, FetchStatus, type State } from './cache';

/**
 * Reads one entry from a fetch cache.
 *
 * A missing entry normally means "not requested yet", which callers render as a loading state. That
 * reading is wrong once the cluster connection has failed: every provider gates its fetch on a connected
 * cluster, so nothing is ever requested and the loading state would never end. Report the failure
 * instead, so the caller's existing `FetchFailed` branch renders with its retry.
 *
 * Recovery needs no extra wiring: when the connection comes back the entry is missing again, which
 * re-arms the caller's fetch-on-mount effect.
 */
export function useCacheEntry<T>(
    entries: State<T>['entries'],
    // Accepts undefined so callers with nothing to look up still call this unconditionally, keeping the
    // hook order stable.
    key: string | number | undefined,
): CacheEntry<T> | undefined {
    const connectionFailed = useClusterConnectionFailed();

    if (key === undefined) return undefined;

    return entries[key] ?? (connectionFailed ? CONNECTION_FAILED : undefined);
}

/** `useCacheEntry` for a set of keys. One hook call, so the key list may vary between renders. */
export function useCacheEntries<T>(
    entries: State<T>['entries'],
    keys: readonly (string | number)[],
): (CacheEntry<T> | undefined)[] {
    const connectionFailed = useClusterConnectionFailed();

    return keys.map(key => entries[key] ?? (connectionFailed ? CONNECTION_FAILED : undefined));
}

// Stable identity, so a failed connection does not hand consumers a new object on every render.
const CONNECTION_FAILED: CacheEntry<never> = { status: FetchStatus.FetchFailed };
