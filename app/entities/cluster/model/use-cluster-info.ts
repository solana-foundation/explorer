'use client';

import { useMemo } from 'react';
import useSWR, { type SWRConfiguration } from 'swr';

import { fetchEpochInfo } from '../api/fetch-epoch-info';
import { fetchEpochSchedule } from '../api/fetch-epoch-schedule';
import { fetchFirstAvailableBlock } from '../api/fetch-first-available-block';
import { ClusterStatus } from '../lib/cluster';
import type { ClusterInfo, EpochInfo } from '../lib/types';
import { useCluster } from './use-cluster';

export type ClusterQueryResult<T> = {
    data: T | undefined;
    error: unknown;
    isLoading: boolean;
};

type Options = { enabled?: boolean };

// The epoch schedule and the first available block can't change for a given cluster URL, so they are
// fetched once and never revalidated.
const IMMUTABLE: SWRConfiguration = {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

// The epoch *advances*: its slot index climbs every slot. Revalidating on mount keeps a client-side
// navigation from rendering a stale snapshot (an activation countdown would start from the wrong slot),
// and the interval keeps a long-lived page roughly in sync without a manual refresh.
const EPOCH_INFO_REFRESH_MS = 30_000;

export function useEpochSchedule(options: Options = {}): ClusterInfo['epochSchedule'] | undefined {
    return useEpochScheduleResult(options).data;
}

export function useEpochScheduleResult(options: Options = {}): ClusterQueryResult<ClusterInfo['epochSchedule']> {
    return useClusterQuery('epoch-schedule', fetchEpochSchedule, options, IMMUTABLE);
}

/** Revalidates on mount and on an interval, so the returned epoch tracks the live cluster. */
export function useEpochInfo(options: Options = {}): EpochInfo | undefined {
    return useEpochInfoResult(options).data;
}

function useEpochInfoResult(options: Options = {}): ClusterQueryResult<EpochInfo> {
    return useClusterQuery('epoch-info', fetchEpochInfo, options, { refreshInterval: EPOCH_INFO_REFRESH_MS });
}

export function useFirstAvailableBlock(options: Options = {}): bigint | undefined {
    return useClusterQuery('first-available-block', fetchFirstAvailableBlock, options, IMMUTABLE).data;
}

export function useClusterInfo(options: Options = {}): ClusterInfo | undefined {
    const epochSchedule = useEpochSchedule(options);
    const epochInfo = useEpochInfo(options);

    return useMemo(
        () => (epochSchedule && epochInfo ? { epochInfo, epochSchedule } : undefined),
        [epochSchedule, epochInfo],
    );
}

function useClusterQuery<T>(
    name: string,
    fetcher: (url: string) => Promise<T>,
    { enabled = true }: Options,
    swrConfig: SWRConfiguration,
): ClusterQueryResult<T> {
    const { url, status } = useCluster();
    const shouldFetch = enabled && status === ClusterStatus.Connected && Boolean(url);
    const { data, error, isLoading } = useSWR(
        shouldFetch ? [name, url] : undefined,
        () => fetcher(url),
        // SWR retries a failed fetch without limit by default. The cap limits the requests to an unreachable RPC.
        { errorRetryCount: 3, ...swrConfig },
    );

    return { data, error, isLoading: shouldFetch && isLoading };
}
