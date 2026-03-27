import type { TokenAmount } from './types';

export type FormatOptions = {
    locale?: string;
    intl?: Intl.NumberFormatOptions;
};

// Format a raw token amount using its decimals (e.g. 1500000n with 6 decimals → "1.5").
// Bigint amounts use lossless arithmetic. Number amounts use Intl.NumberFormat.
export function formatTokenAmount({ amount, decimals }: TokenAmount, options: FormatOptions = {}): string {
    if (typeof amount === 'bigint' && !options.locale && !options.intl) {
        return formatBigint(amount, decimals);
    }
    return formatWithIntl({ amount, decimals }, options);
}

// Convert a raw token amount to a JS number using its decimals.
// Note: precision loss is possible for bigint amounts exceeding Number.MAX_SAFE_INTEGER.
export function tokenAmountToNumber({ amount, decimals }: TokenAmount): number {
    const num = typeof amount === 'bigint' ? Number(amount) : amount;
    if (decimals === 0) return num;
    return num / 10 ** decimals;
}

// Convert a token amount to its fiat equivalent using a per-token price.
export function tokenAmountToFiat(tokenAmount: TokenAmount, pricePerToken: number): number {
    return tokenAmountToNumber(tokenAmount) * pricePerToken;
}

// Lossless bigint formatting — no Number conversion.
function formatBigint(amount: bigint, decimals: number): string {
    if (decimals === 0) return amount.toString();

    const divisor = 10n ** BigInt(decimals);
    const whole = amount / divisor;
    const fractional = amount % divisor;

    if (fractional === 0n) return whole.toString();

    const fractionalStr = fractional.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole}.${fractionalStr}`;
}

// Intl.NumberFormat path — used for number amounts or when locale/formatting options are requested.
function formatWithIntl({ amount, decimals }: TokenAmount, options: FormatOptions = {}): string {
    const { locale = 'en-US', intl } = options;
    const value = tokenAmountToNumber({ amount, decimals });
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: decimals,
        useGrouping: false,
        ...intl,
    }).format(value);
}
