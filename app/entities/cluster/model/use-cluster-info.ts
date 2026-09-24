'use client';

import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { fetchEpochInfo } from '../api/fetch-epoch-info';
import { fetchEpochSchedule } from '../api/fetch-epoch-schedule';
import { fetchFirstAvailableBlock } from '../api/fetch-first-available-block';
import { ClusterStatus } from '../lib/cluster';
import type { ClusterInfo, EpochInfo } from '../lib/types';
import { useCluster } from './use-cluster';

/** A cluster fetch as SWR reports it, so a consumer can tell "failed" from "not fetched yet". */
export type ClusterQueryResult<T> = {
    data: T | undefined;
    error: unknown;
    isLoading: boolean;
};

type Options = { enabled?: boolean };

/**
 * Returns `undefined` for "not connected", "in flight" and "failed". Use `useEpochScheduleResult` where
 * a consumer must report a fetch error.
 */
export function useEpochSchedule(options: Options = {}): ClusterInfo['epochSchedule'] | undefined {
    return useEpochScheduleResult(options).data;
}

export function useEpochScheduleResult(options: Options = {}): ClusterQueryResult<ClusterInfo['epochSchedule']> {
    return useClusterQuery('epoch-schedule', fetchEpochSchedule, options);
}

/** Returns the epoch from the first fetch for the cluster URL. The hook never refetches it. */
export function useEpochInfo(options: Options = {}): EpochInfo | undefined {
    return useEpochInfoResult(options).data;
}

function useEpochInfoResult(options: Options = {}): ClusterQueryResult<EpochInfo> {
    return useClusterQuery('epoch-info', fetchEpochInfo, options);
}

export function useFirstAvailableBlock(options: Options = {}): bigint | undefined {
    return useClusterQuery('first-available-block', fetchFirstAvailableBlock, options).data;
}

/** Fetches both epoch values. Mapping a slot to an epoch needs only `useEpochSchedule`. */
export function useClusterInfo(options: Options = {}): ClusterInfo | undefined {
    const epochSchedule = useEpochSchedule(options);
    const epochInfo = useEpochInfo(options);

    return useMemo(
        () => (epochSchedule && epochInfo ? { epochInfo, epochSchedule } : undefined),
        [epochSchedule, epochInfo],
    );
}

/** SWR dedupes by key, so all consumers of one value share one request. */
function useClusterQuery<T>(
    name: string,
    fetcher: (url: string) => Promise<T>,
    { enabled = true }: Options,
): ClusterQueryResult<T> {
    const { url, status } = useCluster();
    const shouldFetch = enabled && status === ClusterStatus.Connected && Boolean(url);
    const { data, error, isLoading } = useSWRImmutable(
        shouldFetch ? [name, url] : undefined,
        () => fetcher(url),
        // Capped so `error` settles. Each retry yields a fresh Error identity, which re-fires consumers
        // keyed on it — unbounded, that is one report per attempt for as long as the page stays open.
        { errorRetryCount: 3 },
    );

    return { data, error, isLoading: shouldFetch && isLoading };
}
