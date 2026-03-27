import type { TokenAmount } from './types';

export type FormatOptions = {
    locale?: string;
    intl?: Intl.NumberFormatOptions;
};

export function formatTokenAmount({ amount, decimals }: TokenAmount, options: FormatOptions = {}): string {
    if (typeof amount === 'bigint' && !options.locale && !options.intl) {
        return formatBigint(amount, decimals);
    }
    return formatWithIntl({ amount, decimals }, options);
}

// Note: precision loss is possible for bigint amounts exceeding Number.MAX_SAFE_INTEGER.
export function tokenAmountToNumber({ amount, decimals }: TokenAmount): number {
    const num = typeof amount === 'bigint' ? Number(amount) : amount;
    if (decimals === 0) return num;
    return num / 10 ** decimals;
}

export function tokenAmountToFiat(tokenAmount: TokenAmount, pricePerToken: number): number {
    return tokenAmountToNumber(tokenAmount) * pricePerToken;
}

function formatBigint(amount: bigint, decimals: number): string {
    if (decimals === 0) return amount.toString();

    const divisor = 10n ** BigInt(decimals);
    const whole = amount / divisor;
    const fractional = amount % divisor;

    if (fractional === 0n) return whole.toString();

    const padded = fractional.toString().padStart(decimals, '0');
    return `${whole}.${trimTrailingZeros(padded)}`;
}

function trimTrailingZeros(str: string): string {
    let end = str.length;
    while (end > 0 && str[end - 1] === '0') end--;
    return str.slice(0, end);
}

function formatWithIntl({ amount, decimals }: TokenAmount, options: FormatOptions = {}): string {
    const { locale = 'en-US', intl } = options;
    const value = tokenAmountToNumber({ amount, decimals });
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: decimals,
        useGrouping: false,
        ...intl,
    }).format(value);
}
