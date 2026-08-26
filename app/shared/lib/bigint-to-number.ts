/**
 * Recursively replaces bigints with numbers in a JSON-RPC response payload.
 *
 * kit upcasts every integral value in an RPC response to a bigint unless its key path is on an
 * allow-list, and that list covers nothing inside a parsed instruction or a transaction error.
 * Numbers are mandatory downstream: consumers `JSON.stringify` these payloads, which throws on a
 * bigint, and validate them against superstruct `number()` schemas. Precision above 2^53 is lost,
 * which is acceptable because no field reached by this helper — instruction indices, program error
 * codes, account indices — comes close to that bound.
 *
 * Only plain JSON values are supported. `Uint8Array`, `Map`, `Set` and `Date` fail the array check
 * and would be flattened into plain objects, so do not point this at decoded account data.
 */
export function withNumbersInsteadOfBigInts<T>(value: T): T {
    if (typeof value === 'bigint') {
        return Number(value) as T;
    }
    if (Array.isArray(value)) {
        return value.map(withNumbersInsteadOfBigInts) as T;
    }
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, withNumbersInsteadOfBigInts(item)]),
        ) as T;
    }
    return value;
}
