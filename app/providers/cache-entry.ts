'use client';

import { useClusterConnectionFailed } from '@entities/cluster';

import { type CacheEntry, FetchStatus, type State } from './cache';

/**
 * Reads one entry from a fetch cache, reporting a cache miss as a failure while the cluster connection is
 * down — see `entryOrConnectionFailure`.
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

    return entryOrConnectionFailure(entries[key], connectionFailed);
}

/** `useCacheEntry` for a set of keys. One hook call, so the key list may vary between renders. */
export function useCacheEntries<T>(
    entries: State<T>['entries'],
    keys: readonly (string | number)[],
): (CacheEntry<T> | undefined)[] {
    const connectionFailed = useClusterConnectionFailed();

    return keys.map(key => entryOrConnectionFailure(entries[key], connectionFailed));
}

/**
 * A cache miss normally means "not requested yet", which callers render as a loading state. Only a failed
 * connection changes that reading: every provider gates its fetch on a connected cluster, so nothing is
 * ever requested and the loading state would never end. Reporting the miss as a failure puts the caller in
 * the `FetchFailed` branch it already has, with its own message and retry.
 *
 * A hit is always returned as-is, so data fetched before the endpoint died keeps being shown.
 */
function entryOrConnectionFailure<T>(
    entry: CacheEntry<T> | undefined,
    connectionFailed: boolean,
): CacheEntry<T> | undefined {
    if (entry) return entry;
    if (connectionFailed) return CONNECTION_FAILED;
    return undefined;
}

// Stable identity, so a failed connection does not hand consumers a new object on every render.
const CONNECTION_FAILED: CacheEntry<never> = { status: FetchStatus.FetchFailed };
