import {
    fetchRawTransaction,
    getCompiledInstructionSummaries,
    type InstructionSummary,
} from '@entities/transaction-data';
import { useCluster } from '@providers/cluster';
import { useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import { createRateLimitedQueue } from '../lib/rate-limited-queue';

// Rate-limited endpoints cap getTransaction calls per client in a rolling window, and rejected calls
// count too. The budget stays under that cap, with room for other callers. SWR owns caching and dedup.
const queue = createRateLimitedQueue({ budget: 12, rateLimitRetries: 2, windowMs: 10_000 });

// Automatic retries after the first failed attempt.
const RETRY_COUNT = 3;

export type RowTransactionState =
    | { status: 'loading' }
    | { status: 'failed'; retry: () => void }
    | { status: 'loaded'; messageBytes: Uint8Array; summaries: InstructionSummary[] };

/**
 * The message bytes and per-instruction summaries for one history row, from a single base64
 * `getTransaction`. Fetches run through one rate-limited queue for every row, and only when `enabled` (so
 * callers can gate on row visibility).
 */
export function useRowTransaction(signature: string, enabled = true): RowTransactionState {
    const { url } = useCluster();
    const [retriesUsedUp, setRetriesUsedUp] = useState(false);
    // A landed transaction never changes, so treat it as immutable: fetch once,
    // then serve from cache on remount (e.g. tab switches) without re-fetching.
    const { data, mutate } = useSWRImmutable(
        // eslint-disable-next-line unicorn/no-null -- SWR uses null key to disable the request
        enabled ? `history-row-transaction:${url}:${signature}` : null,
        async () => {
            const raw = await queue(() => fetchRawTransaction(url, signature));
            // A null tx is a transient miss (a load-balanced node that has not indexed the signature yet),
            // not "no instructions". Under useSWRImmutable a returned value is a permanent success, so the
            // fetcher throws and SWR retries.
            if (!raw) throw new Error(`history-row-transaction: transaction not found for ${signature}`);
            return { messageBytes: raw.messageBytes, summaries: getCompiledInstructionSummaries(raw.messageBytes) };
        },
        {
            // SWR sets `isValidating` false and keeps `error` between attempts, so only the retry handler
            // can tell a wait from the end of the retries.
            onErrorRetry: (_error, _key, config, revalidate, opts) => {
                if (opts.retryCount > RETRY_COUNT) {
                    setRetriesUsedUp(true);
                    return;
                }
                setTimeout(revalidate, retryDelay(opts.retryCount, config.errorRetryInterval), opts);
            },
            shouldRetryOnError: true,
        },
    );

    if (data !== undefined) return { ...data, status: 'loaded' };
    if (retriesUsedUp) {
        return {
            retry: () => {
                setRetriesUsedUp(false);
                void mutate();
            },
            status: 'failed',
        };
    }
    return { status: 'loading' };
}

// A custom onErrorRetry turns off SWR's default backoff, so this copies it. The random factor runs from 0.5
// to 1.5 and doubles per retry.
function retryDelay(retryCount: number, errorRetryInterval: number): number {
    return ~~((Math.random() + 0.5) * (1 << Math.min(retryCount, 8))) * errorRetryInterval;
}
