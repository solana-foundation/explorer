import { isSolanaError, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR } from '@solana/kit';

export type RateLimitedQueue = <T>(task: () => Promise<T>) => Promise<T>;

const TOO_MANY_REQUESTS = 429;

/**
 * Runs RPC tasks one at a time, starting at most `budget` of them in any `windowMs`. A task the RPC
 * rate limits pauses the whole queue for one window and then runs again, up to `rateLimitRetries` times.
 *
 * The pause applies to every task because a rejected call still counts against the window, so sending
 * more during it keeps the limit in force.
 */
export function createRateLimitedQueue({
    budget,
    windowMs,
    rateLimitRetries,
}: {
    budget: number;
    windowMs: number;
    rateLimitRetries: number;
}): RateLimitedQueue {
    const starts: number[] = [];
    let pausedUntil = 0;
    let tail: Promise<unknown> = Promise.resolve();

    async function waitForSlot(): Promise<void> {
        for (;;) {
            const now = Date.now();
            if (now < pausedUntil) {
                await sleep(pausedUntil - now);
                continue;
            }
            while (starts.length > 0 && now - starts[0] >= windowMs) starts.shift();
            if (starts.length < budget) {
                starts.push(now);
                return;
            }
            await sleep(starts[0] + windowMs - now);
        }
    }

    async function run<T>(task: () => Promise<T>): Promise<T> {
        for (let retries = 0; ; retries++) {
            await waitForSlot();
            try {
                return await task();
            } catch (error) {
                if (!isRateLimited(error)) throw error;
                pausedUntil = Date.now() + windowMs;
                if (retries >= rateLimitRetries) throw error;
            }
        }
    }

    return task => {
        const result = tail.then(() => run(task));
        tail = result.catch(() => undefined);
        return result;
    };
}

function isRateLimited(error: unknown): boolean {
    return (
        isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) && error.context.statusCode === TOO_MANY_REQUESTS
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
