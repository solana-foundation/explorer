/**
 * Formats an amount × price product as `~X.XX USD` with 2-decimal precision
 * and thousands-separators. Returns `~0.00 USD` for NaN or negative results,
 * so callers can render the string unconditionally without branching.
 */
export function formatUsdValue(amount: number, price: number): string {
    const value = amount * price;
    if (isNaN(value) || value < 0) return '~0.00 USD';
    return `~${value.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    })} USD`;
}

/**
 * Parses a formatted USD string into a number, stripping the `~` approximation
 * marker, `$`, comma thousands-separators, and the trailing ` USD` suffix
 * (e.g. `"~1,234.56 USD"` → `1234.56`, `"$50.00"` → `50`).
 */
export function parseUsdNumber(usdValue: string): number | null {
    // eslint-disable-next-line no-restricted-syntax -- regex is the clearest way to strip currency formatting chars
    const n = parseFloat(usdValue.replace(/[~$,]|\s*USD\s*$/gi, ''));
    return Number.isFinite(n) ? n : null;
}

/**
 * Returns this transfer's share of the receipt's total USD value, formatted to
 * match `formatUsdValue` (`"~X.XX USD"`, 2 decimal places, thousands-separators).
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
    return `~${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} USD`;
}
