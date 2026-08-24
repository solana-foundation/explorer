/**
 * Recursively replaces bigints with numbers for web3.js -> Kit migration
 *
 * Precision above 2^53 is lost, exactly as it was when web3.js parsed the same response.
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
