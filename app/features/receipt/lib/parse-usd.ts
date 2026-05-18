/**
 * Parses a formatted USD string into a number, stripping the leading `$` and
 * comma thousands-separators (e.g. `"$1,234.56"` → `1234.56`).
 *
 * Returns `null` when the input cannot be parsed as a finite number — e.g. an
 * empty string or a non-numeric value like `"n/a"`. Callers should treat `null`
 * as "no USD value available" and skip USD-dependent rendering.
 */
export function parseUsdNumber(usdValue: string): number | null {
    // eslint-disable-next-line no-restricted-syntax -- regex is the clearest way to strip currency formatting chars
    const n = parseFloat(usdValue.replace(/[$,]/g, ''));
    return Number.isFinite(n) ? n : null;
}

/**
 * Returns this transfer's share of the receipt's total USD value, formatted as
 * a USD string with two decimal places and thousands-separators (e.g. `"$50.00"`).
 *
 * The share is proportional: `(transferRaw / totalRaw) * totalUsd`. Use this
 * when a single aggregate USD figure (e.g. from Jupiter) must be split across
 * multiple transfers within the same receipt.
 *
 * Returns an empty string when `totalRaw` is `0` to avoid division-by-zero —
 * callers should treat `""` as "no proration available" and render nothing.
 */
export function prorateUsd(transferRaw: number, totalRaw: number, totalUsd: number): string {
    if (totalRaw === 0) return '';
    const value = (transferRaw / totalRaw) * totalUsd;
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}
