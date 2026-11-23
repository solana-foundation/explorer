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

type Options = { enabled?: boolean; refreshInterval?: number };
type QueryOptions = Options & { immutable?: boolean };

/** A sensible interval for a caller that needs the epoch to tick, e.g. a page counting down to activation. */
export const EPOCH_INFO_REFRESH_MS = 30_000;

export function useEpochSchedule(options: Options = {}): ClusterInfo['epochSchedule'] | undefined {
    return useEpochScheduleResult(options).data;
}

export function useEpochScheduleResult(options: Options = {}): ClusterQueryResult<ClusterInfo['epochSchedule']> {
    return useClusterQuery('epoch-schedule', fetchEpochSchedule, { ...options, immutable: true });
}

/**
 * Refetches on mount, focus and reconnect, but polls on a timer only when the caller passes `refreshInterval`.
 * Most callers read the epoch once; a page waiting for the epoch to roll over opts into polling.
 */
export function useEpochInfo(options: Options = {}): EpochInfo | undefined {
    return useEpochInfoResult(options).data;
}

function useEpochInfoResult(options: Options = {}): ClusterQueryResult<EpochInfo> {
    return useClusterQuery('epoch-info', fetchEpochInfo, options);
}

export function useFirstAvailableBlock(options: Options = {}): bigint | undefined {
    return useClusterQuery('first-available-block', fetchFirstAvailableBlock, { ...options, immutable: true }).data;
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
    { enabled = true, immutable: isImmutable = false, refreshInterval }: QueryOptions = {},
): ClusterQueryResult<T> {
    const { url, status } = useCluster();
    const shouldFetch = enabled && status === ClusterStatus.Connected && Boolean(url);
    const { data, error, isLoading } = useSWR(shouldFetch ? [name, url] : undefined, () => fetcher(url), {
        errorRetryCount: 3,
        onError: err => Logger.error(err, { query: name }),
        refreshInterval: isImmutable ? undefined : refreshInterval,
        use: isImmutable ? [immutable] : [],
    });

    return { data, error, isLoading: shouldFetch && isLoading };
}
