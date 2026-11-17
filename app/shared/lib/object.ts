/**
 * Reads an own property, so a key such as `constructor` returns `undefined` instead of a member that
 * every object inherits.
 */
export function getOwn<R extends object, K extends keyof R>(record: R, key: K): OwnValue<R, K>;
export function getOwn(record: object, key: PropertyKey): unknown {
    return Object.hasOwn(record, key) ? Reflect.get(record, key) : undefined;
}

// An index signature admits keys the record lacks. A fixed shape, numeric enum keys included, declares every
// key as an own property.
type OwnValue<R, K extends keyof R> = string extends keyof R
    ? R[K] | undefined
    : `${number}` extends `${keyof R & number}`
      ? R[K] | undefined
      : R[K];
