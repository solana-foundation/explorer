// eslint-disable-next-line no-restricted-syntax -- separates the leading-zero fraction from the first significant digit
const LEADING_ZEROS_RE = /^(0\.0*)([1-9].*)/;

/**
 * Splits a formatted decimal string into its leading-zero fraction and the
 * tail starting at the first non-zero digit. Amounts whose integer part is
 * non-zero (or that don't start with `0.0…`) are returned unsplit, with the
 * whole value in `significantDigits`.
 *
 * Examples:
 *   "0.000123"     → { leadingZeros: "0.000", significantDigits: "123" }
 *   "0.024922118"  → { leadingZeros: "0.0",   significantDigits: "24922118" }
 *   "0.1"          → { leadingZeros: "0.",    significantDigits: "1" }
 *   "1.4224"       → { leadingZeros: "",      significantDigits: "1.4224" }
 *   "42"           → { leadingZeros: "",      significantDigits: "42" }
 *   "0"            → { leadingZeros: "",      significantDigits: "0" }
 */
export function splitAtFirstNonZeroDigit(formatted: string): {
    leadingZeros: string;
    significantDigits: string;
} {
    const match = formatted.match(LEADING_ZEROS_RE);
    if (!match) return { leadingZeros: '', significantDigits: formatted };
    return { leadingZeros: match[1], significantDigits: match[2] };
}
