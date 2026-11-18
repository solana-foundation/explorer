/**
 * Reads an own property, so a key such as `constructor` returns `undefined` instead of a member that
 * every object inherits. The return type assumes plain data. A class method is inherited, so `getOwn`
 * returns `undefined` for it.
 */
export function getOwn<R extends object, K extends keyof R>(record: R, key: K): OwnValue<R, K>;
export function getOwn(record: object, key: PropertyKey): unknown {
    return Object.hasOwn(record, key) ? Reflect.get(record, key) : undefined;
}

type OwnValue<R, K extends keyof R> = K extends LiteralKeys<R> ? R[K] : R[K] | undefined;

// `{}` is assignable to an index signature, but not to a type with a literal key.
type LiteralKeys<R> = keyof { [P in keyof R as Record<never, never> extends Record<P, unknown> ? never : P]: unknown };
