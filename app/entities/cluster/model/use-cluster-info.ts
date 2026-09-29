'use client';

import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

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

export function useEpochSchedule(options: Options = {}): ClusterInfo['epochSchedule'] | undefined {
    return useEpochScheduleResult(options).data;
}

export function useEpochScheduleResult(options: Options = {}): ClusterQueryResult<ClusterInfo['epochSchedule']> {
    return useClusterQuery('epoch-schedule', fetchEpochSchedule, options);
}

/** Returns the epoch from the first successful fetch for the cluster URL. The hook never refetches it. */
export function useEpochInfo(options: Options = {}): EpochInfo | undefined {
    return useEpochInfoResult(options).data;
}

function useEpochInfoResult(options: Options = {}): ClusterQueryResult<EpochInfo> {
    return useClusterQuery('epoch-info', fetchEpochInfo, options);
}

export function useFirstAvailableBlock(options: Options = {}): bigint | undefined {
    return useClusterQuery('first-available-block', fetchFirstAvailableBlock, options).data;
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
): ClusterQueryResult<T> {
    const { url, status } = useCluster();
    const shouldFetch = enabled && status === ClusterStatus.Connected && Boolean(url);
    const { data, error, isLoading } = useSWRImmutable(
        shouldFetch ? [name, url] : undefined,
        () => fetcher(url),
        // SWR retries a failed fetch without limit by default. The cap limits the requests to an unreachable RPC.
        { errorRetryCount: 3 },
    );

    return { data, error, isLoading: shouldFetch && isLoading };
}
