/** A numeric value represented as a decimal string when it exceeds Number.MAX_SAFE_INTEGER — String(bigint) is exact, no precision loss. */
export type SafeNumeric = number | string | null;

export type UnknownMarker = {
    value: null;
    status: 'unknown';
    reason: string;
};
