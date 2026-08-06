import { BigNumber } from 'bignumber.js';

/**
 * Derive the scaled UI amount multiplier straight from an RPC token balance. jsonParsed already applies
 * the multiplier to uiAmount, so multiplier = uiAmount / (rawAmount / 10^decimals). This lets holdings
 * lists show the multiplier without a per-mint account fetch. Returns "1" when unscaled or rawAmount is 0.
 */
export function deriveScaledUiAmountMultiplier(rawAmount: string, decimals: number, uiAmountString: string): string {
    const raw = new BigNumber(rawAmount);
    if (!raw.isFinite() || raw.isZero()) return '1';

    const baseUiAmount = raw.dividedBy(new BigNumber(10).pow(decimals));
    if (baseUiAmount.isZero()) return '1';

    const multiplier = new BigNumber(uiAmountString).dividedBy(baseUiAmount);
    if (!multiplier.isFinite()) return '1';

    // Round to shed float noise so genuinely unscaled balances collapse to "1" and hide the tooltip.
    const rounded = multiplier.decimalPlaces(6);
    return rounded.eq(1) ? '1' : rounded.toString();
}
