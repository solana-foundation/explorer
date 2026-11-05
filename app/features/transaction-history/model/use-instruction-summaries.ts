import { fetchTransactionDetails, getInstructionSummaries, type InstructionSummary } from '@entities/transaction-data';
import { useCluster } from '@providers/cluster';
import { withBackoff } from '@utils/with-backoff';
import pLimit from 'p-limit';
import useSWRImmutable from 'swr/immutable';

// One global slot: requests run one at a time to avoid rate-limit (429) errors.
// Caching, dedup, and revalidation are owned by the SWR call below.
const limit = pLimit(1);

export type InstructionSummariesState =
    | { status: 'loading' }
    | { status: 'failed'; retry: () => void }
    | { status: 'loaded'; summaries: InstructionSummary[] };

/**
 * Per-instruction summaries for one transaction signature. Fetches run through a global
 * sequential queue to avoid rate-limit (429) errors, and only when `enabled` (so callers
 * can gate on row visibility).
 */
export function useInstructionSummaries(signature: string, enabled = true): InstructionSummariesState {
    const { url } = useCluster();
    // A finalized parsed transaction never changes, so treat it as immutable: fetch once,
    // then serve from cache on remount (e.g. tab switches) without re-fetching.
    const { data, error, isValidating, mutate } = useSWRImmutable(
        // eslint-disable-next-line unicorn/no-null -- SWR uses null key to disable the request
        enabled ? `instruction-summaries:${url}:${signature}` : null,
        async () => {
            // Shallow inner backoff: it holds the single slot during its sleeps, so a rate-limited
            // signature here head-of-line blocks every other row. Keep that window short and let SWR's
            // errorRetryCount do the longer recovery — those retries run with the slot already freed.
            const tx = await limit(() => withBackoff(() => fetchTransactionDetails(url, signature), { maxRetries: 2 }));
            // A null tx is a transient miss (a load-balanced node that hasn't indexed the signature
            // yet), not "no instructions" — throw so SWR retries instead of caching [] permanently.
            // Under useSWRImmutable a returned value is a permanent success, so caching that empty
            // would leave the row blank for the rest of the session; the IDL resolver guards the same
            // trap. A non-null tx with no summarizable instructions still returns a real [].
            if (!tx) throw new Error(`instruction-summaries: transaction not found for ${signature}`);
            return getInstructionSummaries(tx);
        },
        // errorRetryInterval is SWR's default of 5 s, doubled on each retry.
        { errorRetryCount: 3 },
    );

    if (data !== undefined) return { status: 'loaded', summaries: data };
    // SWR keeps `error` set while a retry runs, so the row shows loading again during that retry.
    if (error !== undefined && !isValidating) return { retry: () => void mutate(), status: 'failed' };
    return { status: 'loading' };
}
