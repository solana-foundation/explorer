import { createRateLimitedQueue, type RateLimitedQueue } from './rate-limited-queue';

// The measured limit of the mainnet explorer-api endpoint is 15 getTransaction calls per client in a rolling 10 s.
// The measured limit is lower than the 40 in the Solana cluster docs.
// The endpoint returns the limit in the `x-ratelimit-method-limit` response header.
// The budget is below the limit to allow calls from other callers.
const QUEUE_OPTIONS = { budget: 12, rateLimitRetries: 2, windowMs: 10_000 };

const queues = new Map<string, RateLimitedQueue>();

// Row fetches and parsed-transaction fetches share one queue per url, so their calls count against one budget.
export function getTransactionQueue(url: string): RateLimitedQueue {
    let queue = queues.get(url);
    if (!queue) {
        queue = createRateLimitedQueue(QUEUE_OPTIONS);
        queues.set(url, queue);
    }
    return queue;
}
