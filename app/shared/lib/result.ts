/** Error-first result tuple for single-attempt operations. */
export type Result<T, E extends Error = Error> = readonly [E, undefined] | readonly [undefined, T];

export const ok = <T>(value: T): Result<T, never> => [undefined, value];
export const err = <E extends Error>(error: E): Result<never, E> => [error, undefined];

/** Coerces a caught unknown into an Error. */
export const toError = (thrown: unknown): Error => (thrown instanceof Error ? thrown : new Error(String(thrown)));
