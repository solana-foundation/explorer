export const USD_FALLBACK = '~0.00 USD';

export function formatUsdValue(amount: number, price: number): string | null;
export function formatUsdValue(amount: number, price: number, orFallback: string): string;
export function formatUsdValue(amount: number, price: number, orFallback?: string): string | null {
    const value = amount * price;
    if (!Number.isFinite(value) || value < 0) return orFallback ?? null;
    return `~${value.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    })} USD`;
}

export function parseUsdNumber(usdValue: string): number | null {
    let s = usdValue.trim();
    if (s.toLowerCase().endsWith('usd')) s = s.slice(0, -3).trimEnd();
    if (s.startsWith('~')) s = s.slice(1);
    if (s.startsWith('$')) s = s.slice(1);
    const n = parseFloat(s.split(',').join(''));
    return Number.isFinite(n) ? n : null;
}

// Returns `''` for div-by-zero (no proration possible) — distinct from invalid input.
export function prorateUsd(transferRaw: number, totalRaw: number, totalUsd: number): string | null;
export function prorateUsd(transferRaw: number, totalRaw: number, totalUsd: number, orFallback: string): string;
export function prorateUsd(
    transferRaw: number,
    totalRaw: number,
    totalUsd: number,
    orFallback?: string,
): string | null {
    if (totalRaw === 0) return '';
    const value = (transferRaw / totalRaw) * totalUsd;
    if (!Number.isFinite(value) || value < 0) return orFallback ?? null;
    return `~${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} USD`;
}
