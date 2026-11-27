import {
    fetchRawTransaction,
    getCompiledInstructionSummaries,
    type InstructionSummary,
} from '@entities/transaction-data';
import { useCluster } from '@providers/cluster';
import type { ReadonlyUint8Array } from '@solana/kit';
import { useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { getTransactionQueue } from '../lib/get-transaction-queue';
import { TaskSkippedError } from '../lib/rate-limited-queue';
import { isQueueKeyEnabled, useEnabledQueueKey } from './enabled-queue-keys';

// The queue's 429 retries run inside each SWR retry.
// One row can make up to (RETRY_COUNT + 1) * (rateLimitRetries + 1) calls.
const RETRY_COUNT = 3;

export type RowTransactionState =
    | { status: 'loading' }
    | { status: 'failed'; retry: () => void }
    | { status: 'loaded'; messageBytes: ReadonlyUint8Array; summaries: readonly InstructionSummary[] };

/**
 * The message bytes and per-instruction summaries for one history row, from a single base64
 * `getTransaction`. Fetches run through one rate-limited queue per cluster, and only when `enabled` (so
 * callers can gate on row visibility).
 */
export function useRowTransaction(signature: string, enabled = true): RowTransactionState {
    const { url } = useCluster();
    const key = `history-row-transaction:${url}:${signature}`;
    const [failedKey, setFailedKey] = useState<string>();
    useEnabledQueueKey(key, enabled);
    // A landed transaction never changes, so treat it as immutable: fetch once,
    // then serve from cache on remount (e.g. tab switches) without re-fetching.
    const { data, mutate } = useSWRImmutable(
        // eslint-disable-next-line unicorn/no-null -- SWR uses null key to disable the request
        enabled ? key : null,
        async () => {
            const raw = await getTransactionQueue(url)(
                () => fetchRawTransaction(url, signature, { abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
                () => isQueueKeyEnabled(key),
            );
            // A null tx is a transient miss (a load-balanced node that has not indexed the signature yet),
            // not "no instructions". Under useSWRImmutable a returned value is a permanent success, so the
            // fetcher throws and SWR retries.
            if (!raw) throw new Error(`history-row-transaction: transaction not found for ${signature}`);
            return { messageBytes: raw.messageBytes, summaries: getCompiledInstructionSummaries(raw.messageBytes) };
        },
        {
            // SWR sets `isValidating` false and keeps `error` between attempts, so only the retry handler
            // can tell a wait from the end of the retries.
            onErrorRetry: (error, errorKey, config, revalidate, opts) => {
                if (error instanceof TaskSkippedError) return;
                if (opts.retryCount > RETRY_COUNT) {
                    Logger.warn('[transaction-history] row fetch failed after its retries', {
                        sentry: 'always',
                        sentryExtras: { error: String(error), signature },
                    });
                    setFailedKey(errorKey);
                    return;
                }
                // SWR's default `errorRetryInterval` is 5 s, or 10 s on a slow connection.
                setTimeout(revalidate, config.errorRetryInterval, opts);
            },
            shouldRetryOnError: true,
        },
    );

    if (data !== undefined) return { ...data, status: 'loaded' };
    if (failedKey === key) {
        return {
            retry: () => {
                setFailedKey(undefined);
                void mutate();
            },
            status: 'failed',
        };
    }
    return { status: 'loading' };
}
