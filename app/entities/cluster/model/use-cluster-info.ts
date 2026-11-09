'use client';

import { Logger } from '@shared/lib/logger';
import { useMemo } from 'react';
import useSWR from 'swr';
import { immutable } from 'swr/immutable';

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
type QueryOptions = Options & { refreshInterval?: number };

const EPOCH_INFO_REFRESH_MS = 30_000;

export function useEpochSchedule(options: Options = {}): ClusterInfo['epochSchedule'] | undefined {
    return useEpochScheduleResult(options).data;
}

export function useEpochScheduleResult(options: Options = {}): ClusterQueryResult<ClusterInfo['epochSchedule']> {
    return useClusterQuery('epoch-schedule', fetchEpochSchedule, options);
}

/** Refetches on mount, focus, reconnect and on an interval, so the returned value changes while a page stays open. */
export function useEpochInfo(options: Options = {}): EpochInfo | undefined {
    return useEpochInfoResult(options).data;
}

function useEpochInfoResult(options: Options = {}): ClusterQueryResult<EpochInfo> {
    return useClusterQuery('epoch-info', fetchEpochInfo, { ...options, refreshInterval: EPOCH_INFO_REFRESH_MS });
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
    { enabled = true, refreshInterval }: QueryOptions = {},
): ClusterQueryResult<T> {
    const { url, status } = useCluster();
    const shouldFetch = enabled && status === ClusterStatus.Connected && Boolean(url);
    const { data, error, isLoading } = useSWR(shouldFetch ? [name, url] : undefined, () => fetcher(url), {
        errorRetryCount: 3,
        onError: err => Logger.error(err, { query: name }),
        refreshInterval,
        use: refreshInterval !== undefined ? [] : [immutable],
    });

    return { data, error, isLoading: shouldFetch && isLoading };
}
