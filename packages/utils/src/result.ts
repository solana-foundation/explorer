/** Error-first result tuple for single-attempt operations. */
export type Result<T, E extends Error = Error> = readonly [E, undefined] | readonly [undefined, T];

export const ok = <T>(value: T): Result<T, never> => [undefined, value];
export const err = <E extends Error>(error: E): Result<never, E> => [error, undefined];

/** Returns the ok value or throws the carried error. */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
    if (isErr(result)) throw result[0];
    return result[1];
}

/** Returns the ok value or the fallback. */
export function unwrapOr<T, E extends Error, F>(result: Result<T, E>, fallback: F): T | F {
    return isErr(result) ? fallback : result[1];
}

const isErr = <T, E extends Error>(result: Result<T, E>): result is readonly [E, undefined] => result[0] !== undefined;

/** Coerces a caught unknown into an Error. */
export const toError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)));
