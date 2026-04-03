/** Parses `str` as a non-negative decimal integer. Returns `undefined` if invalid. */
export function parseNaturalNumber(str: string): number | undefined {
    if (str.length === 0 || str.trimStart() !== str) return undefined;
    const n = Number(str);
    if (isNaN(n) || !Number.isInteger(n) || n < 0 || String(n) !== str) return undefined;
    return n;
}
