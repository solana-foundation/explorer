import { Logger } from '@/app/shared/lib/logger';

type BackoffOptions = {
    maxRetries?: number;
    initialDelay?: number;
    factor?: number;
    /**
     * Ends the retry loop once aborted. A caller that has already given up cannot use a later
     * result, and every remaining attempt would otherwise sleep for an escalating delay first —
     * which would let the loop outlive the deadline it is meant to respect.
     */
    signal?: AbortSignal;
};

export function withBackoff<T>(fn: () => Promise<T>, options?: BackoffOptions): Promise<T> {
    const { maxRetries = 5, initialDelay = 300, factor = 2, signal } = options ?? {};

    async function attempt(retries: number, delay: number): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0 || signal?.aborted) throw error;
            Logger.debug('[utils:with-backoff] Retrying after failure', { delay, error, retriesLeft: retries });
            await new Promise(resolve => setTimeout(resolve, delay));
            // The signal can abort while this attempt sleeps. Re-check rather than spend a retry,
            // so an abort costs at most the delay already in flight.
            if (signal?.aborted) throw error;
            return attempt(retries - 1, delay * factor);
        }
    }

    return attempt(maxRetries, initialDelay);
}
