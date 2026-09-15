/**
 * Every task's value, in input order, with `undefined` for any that had not settled within `timeoutMs`.
 *
 * One timer for the whole batch, cleared on the way out - an uncleared timer holds the event loop open for
 * the rest of the budget after the work is done.
 *
 * A task that runs out of budget is abandoned, not cancelled. Pair this with an `AbortSignal` to stop the
 * work itself.
 *
 * Rejections propagate, as with `Promise.all`. Catch inside a task for the batch to survive its failure.
 * @param timeoutMs - The budget for the whole batch
 * @param tasks - Already-started promises, so they run concurrently rather than in sequence
 */
export async function settleWithin<T>(timeoutMs: number, tasks: readonly Promise<T>[]): Promise<(T | undefined)[]> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const elapsed = new Promise<undefined>(resolve => {
        timer = setTimeout(() => resolve(undefined), timeoutMs);
    });

    try {
        return await Promise.all(tasks.map(task => Promise.race([task, elapsed])));
    } finally {
        clearTimeout(timer);
    }
}
