import { fetchAll } from '@utils/fetch-all';
import { withBackoff } from '@utils/with-backoff';

import { type RewardEpochRange } from '../lib/epoch-range';

/**
 * Matches the client paths, which use 1 and 2 after #854 traced 429s to parallel fetching. 8 was
 * measured to rate-limit a cold sweep partway through, and the request that pays for the cold
 * sweep is the one least able to absorb a failure. After warm-up only the newest epoch is an
 * uncached call, so a low ceiling costs nothing in the steady state.
 */
const SWEEP_CONCURRENCY = 2;

/**
 * A cold sweep is long enough to trip a provider's rate limit partway through — measured, not
 * theorised. Recovering from that needs patience rather than speed: the default 300ms/600ms
 * window is far shorter than any rate-limit window, so it burns its retries and fails.
 */
const MAX_RETRIES = 4;
const RETRY_INITIAL_DELAY_MS = 1_000;

/**
 * Ceiling for one epoch's call. A healthy RPC answers far inside this; the point is to turn a hung
 * socket into a rejection. Without it `withBackoff` cannot retry a hang at all — a pending promise
 * is neither a success nor a failure, so it would hold its concurrency slot, and the sweep, open
 * until the platform killed the function.
 */
const EPOCH_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Ceiling for the whole sweep. Per-call timeouts bound one epoch, never the total: the range grows
 * with the account's age, and at `SWEEP_CONCURRENCY` a cold sweep of a long-lived account takes
 * hundreds of sequential rounds. This keeps the sweep inside the route's `maxDuration`, so the
 * route answers with its own logged error instead of being killed mid-flight.
 *
 * Hitting it is not a dead end: every settled epoch that did resolve stays cached, so a retry
 * resumes where this attempt stopped rather than starting over.
 */
const SWEEP_BUDGET_MS = 40_000;

/**
 * Sums a stake account's inflation rewards across `range`.
 *
 * Throws when any epoch still fails after retries. A partial total cannot be told apart from a
 * correct one, so the caller must surface the failure rather than return what did succeed. The
 * epochs that did resolve stay in the cache, so a retry re-fetches only what failed.
 */
export async function sumInflationRewards({
    address,
    range,
    url,
}: {
    address: string;
    range: RewardEpochRange;
    url: string;
}): Promise<number> {
    const epochs: number[] = [];
    for (let epoch = range.fromEpoch; epoch <= range.toEpoch; epoch++) {
        epochs.push(epoch);
    }

    // One deadline shared by every epoch, including those still queued behind `SWEEP_CONCURRENCY`.
    const sweepDeadline = AbortSignal.timeout(SWEEP_BUDGET_MS);

    const amounts = await fetchAll(
        epochs,
        epoch =>
            withBackoff(
                () => fetchEpochReward({ address, epoch, isNewest: epoch === range.toEpoch, sweepDeadline, url }),
                {
                    initialDelay: RETRY_INITIAL_DELAY_MS,
                    maxRetries: MAX_RETRIES,
                    signal: sweepDeadline,
                },
            ),
        SWEEP_CONCURRENCY,
    );

    return amounts.reduce((total, amount) => total + amount, 0);
}

async function fetchEpochReward({
    address,
    epoch,
    isNewest,
    sweepDeadline,
    url,
}: {
    address: string;
    epoch: number;
    isNewest: boolean;
    sweepDeadline: AbortSignal;
    url: string;
}): Promise<number> {
    const response = await fetch(url, {
        // The request body is part of the cache key, so this id must be deterministic. A random
        // or incrementing id would make every call a cache miss.
        body: JSON.stringify({
            id: `stake-rewards:${epoch}`,
            jsonrpc: '2.0',
            method: 'getInflationReward',
            params: [[address], { epoch }],
        }),
        // A settled epoch's reward never changes, so it is cached with no expiry. The newest epoch
        // may not have settled yet — caching a not-yet-settled epoch would store a permanent zero.
        cache: isNewest ? 'no-store' : 'force-cache',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        // Safe for the cache above: Next hashes a fetch cache key from url, method, headers, body
        // and `cache` only, so a per-call signal cannot turn a hit into a miss. A fresh timeout per
        // attempt races the sweep-wide deadline — whichever fires first aborts this call.
        signal: AbortSignal.any([sweepDeadline, AbortSignal.timeout(EPOCH_REQUEST_TIMEOUT_MS)]),
        ...(isNewest ? {} : { next: { revalidate: false as const } }),
    });

    if (!response.ok) {
        throw new Error(`getInflationReward failed for epoch ${epoch}: HTTP ${response.status}`);
    }

    const body = await response.json();

    if (body.error) {
        throw new Error(`getInflationReward failed for epoch ${epoch}: ${body.error.message}`);
    }

    // A null entry means the epoch paid this account nothing — a delinquent validator, or an epoch
    // the RPC does not serve. That is a real zero, not a failure.
    return body.result?.[0]?.amount ?? 0;
}
