import {
    fetchRawTransaction,
    getCompiledInstructionSummaries,
    type InstructionSummary,
} from '@entities/transaction-data';
import { useCluster } from '@providers/cluster';
import { withBackoff } from '@utils/with-backoff';
import pLimit from 'p-limit';
import { useState } from 'react';
import useSWRImmutable from 'swr/immutable';

// One global slot, so requests run one at a time and avoid rate-limit (429) errors. The SWR call below
// owns caching, dedup and revalidation.
const limit = pLimit(1);

// Automatic retries after the first failed attempt.
const RETRY_COUNT = 3;

export type RowTransactionState =
    | { status: 'loading' }
    | { status: 'failed'; retry: () => void }
    | { status: 'loaded'; messageBytes: Uint8Array; summaries: InstructionSummary[] };

/**
 * The message bytes and per-instruction summaries for one history row, from a single base64
 * `getTransaction`. Fetches run through a global sequential queue to avoid rate-limit (429) errors, and
 * only when `enabled` (so callers can gate on row visibility).
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
            // The inner backoff holds the single slot during its sleeps, so a rate-limited signature blocks
            // every other row. It stays short, and the SWR retries below run later with the slot free.
            const raw = await limit(() => withBackoff(() => fetchRawTransaction(url, signature), { maxRetries: 2 }));
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
