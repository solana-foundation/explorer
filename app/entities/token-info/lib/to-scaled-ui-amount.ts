import { BigNumber } from 'bignumber.js';

// The token program scales with an f64 product that it truncates toward zero. Exact decimal
// arithmetic would differ from the amount that the RPC returns.
export function toScaledUiAmount({
    rawAmount,
    decimals,
    multiplier,
}: {
    rawAmount: string | number;
    decimals: number;
    multiplier: string;
}): BigNumber {
    // An f64 product rounds a raw amount above 2^53, so an amount with no multiplier stays exact.
    const scaledRawAmount =
        multiplier === '1'
            ? new BigNumber(rawAmount)
            : new BigNumber(Math.trunc(Number(rawAmount) * Number(multiplier)));
    return scaledRawAmount.shiftedBy(-decimals);
}
