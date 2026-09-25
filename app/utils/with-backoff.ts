import { Logger } from '@/app/shared/lib/logger';

export type BackoffOptions = {
    maxRetries?: number;
    initialDelay?: number;
    factor?: number;
    /** Which failures are worth another attempt. */
    shouldRetry?: (error: unknown) => boolean;
    /**
     * The caller's deadline. Once fired the loop stops and the abort reason surfaces in place of the
     * failure, so a caller that has moved on never has another attempt started on its behalf.
     */
    abortSignal?: AbortSignal;
};

export function withBackoff<T>(fn: () => Promise<T>, options?: BackoffOptions): Promise<T> {
    const { maxRetries = 5, initialDelay = 300, factor = 2, shouldRetry = () => true, abortSignal } = options ?? {};

    async function attempt(retries: number, delay: number): Promise<T> {
        abortSignal?.throwIfAborted();
        try {
            return await fn();
        } catch (error) {
            // Checked before the retry decision so an expired deadline reports as an abort rather than as
            // whichever failure happened to arrive alongside it.
            abortSignal?.throwIfAborted();
            // The predicate is checked with the retry budget, not before it, so an exhausted budget and a
            // fatal error throw the same way and neither logs a retry it is not about to make.
            if (retries <= 0 || !shouldRetry(error)) throw error;
            Logger.debug('[utils:with-backoff] Retrying after failure', { delay, error, retriesLeft: retries });
            await sleep(delay, abortSignal);
            return attempt(retries - 1, delay * factor);
        }
    }

    return attempt(maxRetries, initialDelay);
}

/**
 * Resolves on the delay or on the caller's abort, whichever lands first.
 *
 * Never rejects: the `throwIfAborted` reports the abort in the next attempt from the withBackoff fn.
 */
function sleep(delay: number, abortSignal?: AbortSignal): Promise<void> {
    return new Promise(resolve => {
        function onAbort() {
            clearTimeout(timer);
            resolve();
        }

        const timer = setTimeout(() => {
            abortSignal?.removeEventListener('abort', onAbort);
            resolve();
        }, delay);

        abortSignal?.addEventListener('abort', onAbort, { once: true });
    });
}
