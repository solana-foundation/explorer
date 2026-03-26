import type { TokenAmount } from './types';

export type FormatOptions = {
    locale?: string;
    intl?: Intl.NumberFormatOptions;
};

// Format a raw token amount using its decimals (e.g. 1500000 with 6 decimals → "1.5").
// Delegates to Intl.NumberFormat for decimal formatting.
export function formatTokenAmount({ amount, decimals }: TokenAmount, options: FormatOptions = {}): string {
    const { locale = 'en-US', intl } = options;
    const value = tokenAmountToNumber({ amount, decimals });
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: decimals,
        useGrouping: false,
        ...intl,
    }).format(value);
}

// Convert a raw token amount to a JS number using its decimals.
// Useful for calculations and comparisons where string output isn't needed.
// Note: precision loss is possible for amounts exceeding Number.MAX_SAFE_INTEGER.
export function tokenAmountToNumber({ amount, decimals }: TokenAmount): number {
    if (decimals === 0) return Number(amount);
    const divisor = 10 ** decimals;
    return Number(amount) / divisor;
}

// Convert a token amount to its fiat equivalent using a per-token price.
// Applies decimals before multiplying, so raw lamports or raw USDC
// micro-units are handled correctly without the caller needing to know the denomination.
export function tokenAmountToFiat(tokenAmount: TokenAmount, pricePerToken: number): number {
    return tokenAmountToNumber(tokenAmount) * pricePerToken;
}
