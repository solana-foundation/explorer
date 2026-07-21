/**
 * Race a promise against a timeout — only for library calls that do NOT accept an AbortSignal
 * (prefer AbortSignal.timeout(ms) for fetch/RPC: it cancels the underlying request).
 * On timeout the underlying promise keeps running until it settles.
 */
export function raceWithTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}
