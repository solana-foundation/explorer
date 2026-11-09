import {
    fetchRawTransaction,
    getCompiledInstructionSummaries,
    type InstructionSummary,
} from '@entities/transaction-data';
import { useCluster } from '@providers/cluster';
import type { ReadonlyUint8Array } from '@solana/kit';
import { useLayoutEffect, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { createRateLimitedQueue, type RateLimitedQueue, TaskSkippedError } from '../lib/rate-limited-queue';

// The measured limit of the mainnet explorer-api endpoint is 15 getTransaction calls per client in a rolling 10 s.
// The measured limit is lower than the 40 in the Solana cluster docs.
// The endpoint returns the limit in the `x-ratelimit-method-limit` response header.
// The budget is below the limit to allow calls from other callers.
const QUEUE_OPTIONS = { budget: 12, rateLimitRetries: 2, windowMs: 10_000 };

// The queue's 429 retries run inside each SWR retry.
// One row can make up to (RETRY_COUNT + 1) * (rateLimitRetries + 1) calls.
const RETRY_COUNT = 3;

export type RowTransactionState =
    | { status: 'loading' }
    | { status: 'failed'; retry: () => void }
    | { status: 'loaded'; messageBytes: ReadonlyUint8Array; summaries: readonly InstructionSummary[] };

/**
 * The message bytes and per-instruction summaries for one history row, from a single base64
 * `getTransaction`. Fetches run through one rate-limited queue for every row, and only when `enabled` (so
 * callers can gate on row visibility).
 */
export function useRowTransaction(signature: string, enabled = true): RowTransactionState {
    const { url } = useCluster();
    const key = `history-row-transaction:${url}:${signature}`;
    const [failedKey, setFailedKey] = useState<string>();
    useEnabledRowKey(key, enabled);
    // A landed transaction never changes, so treat it as immutable: fetch once,
    // then serve from cache on remount (e.g. tab switches) without re-fetching.
    const { data, mutate } = useSWRImmutable(
        // eslint-disable-next-line unicorn/no-null -- SWR uses null key to disable the request
        enabled ? key : null,
        async () => {
            const raw = await queueFor(url)(
                () => fetchRawTransaction(url, signature, { abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
                () => enabledRowKeys.has(key),
            );
            // A null tx is a transient miss (a load-balanced node that has not indexed the signature yet),
            // not "no instructions". Under useSWRImmutable a returned value is a permanent success, so the
            // fetcher throws and SWR retries.
            if (!raw) throw new Error(`history-row-transaction: transaction not found for ${signature}`);
            return { messageBytes: raw.messageBytes, summaries: decodeSummaries(raw.messageBytes, signature) };
        },
        {
            // SWR sets `isValidating` false and keeps `error` between attempts, so only the retry handler
            // can tell a wait from the end of the retries.
            onErrorRetry: (error, errorKey, config, revalidate, opts) => {
                if (error instanceof TaskSkippedError) return;
                if (opts.retryCount > RETRY_COUNT) {
                    Logger.warn('[transaction-history] row fetch failed after its retries', {
                        error,
                        sentry: 'always',
                        sentryExtras: { error: String(error), signature },
                        signature,
                        url,
                    });
                    setFailedKey(errorKey);
                    return;
                }
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

const enabledRowKeys = new Set<string>();

function useEnabledRowKey(key: string, enabled: boolean): void {
    useLayoutEffect(() => {
        if (!enabled) return;
        enabledRowKeys.add(key);
        return () => {
            enabledRowKeys.delete(key);
        };
    }, [key, enabled]);
}

// The same bytes fail to decode on every attempt, so a decode error is reported and the fetch is not retried.
function decodeSummaries(messageBytes: ReadonlyUint8Array, signature: string): readonly InstructionSummary[] {
    try {
        return getCompiledInstructionSummaries(messageBytes);
    } catch (error) {
        Logger.error(error, { sentry: 'always', sentryExtras: { signature }, signature });
        return [];
    }
}

const queues = new Map<string, RateLimitedQueue>();

function queueFor(url: string): RateLimitedQueue {
    let queue = queues.get(url);
    if (!queue) {
        queue = createRateLimitedQueue(QUEUE_OPTIONS);
        queues.set(url, queue);
    }
    return queue;
}
