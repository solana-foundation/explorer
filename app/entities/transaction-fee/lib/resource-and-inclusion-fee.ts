/**
 * SIMD-0553 ("Resource and Inclusion Fee") replaces today's flat 5,000-lamport-per-signature base
 * fee with two parts: a 2,500-lamport inclusion fee paid entirely to the leader, and a resource fee
 * burned in full that scales with the cost units the transaction *requested*. Priority fees are
 * untouched (SIMD-0096), so a projected total is
 *
 *     total_fee = base_inclusion_fee + priority_fee + resource_fee
 *     resource_fee = ceil_div(requested_cost_units * numerator, denominator)
 *
 * None of the three feature gates that ramp the rate (`resource_fee_burn_1_10`, `_1_4`, `_1_2`) are
 * in the feature-gate registry yet — the SGP endorsing this direction is still a draft — so this
 * models what a landed transaction *would* pay rather than reading an activation status.
 */

/** SIMD-0553's inclusion fee, charged per transaction rather than per signature. */
export const BASE_INCLUSION_FEE_LAMPORTS = 2_500;

/** Today's base fee, per signature. Needed to back the priority fee out of a landed total. */
export const LAMPORTS_PER_SIGNATURE = 5_000;

export type ResourceFeeRate = Readonly<{
    denominator: number;
    /** The rate as written in the SIMD, for display. */
    label: string;
    numerator: number;
}>;

/**
 * The staged rates, in activation order. The ramp is deliberate: it gives applications room to
 * tighten their compute budgets before the terminal 1/2-lamport-per-cost-unit rate lands.
 */
export const RESOURCE_FEE_RATES: readonly ResourceFeeRate[] = [
    { denominator: 10, label: '1/10', numerator: 1 },
    { denominator: 4, label: '1/4', numerator: 1 },
    { denominator: 2, label: '1/2', numerator: 1 },
];

export type ProjectedFee = Readonly<{
    rate: ResourceFeeRate;
    resourceFeeLamports: number;
    totalFeeLamports: number;
}>;

/**
 * Projects what a transaction would pay at each staged rate, given the cost units it requested and
 * the priority fee it already pays.
 */
export function projectResourceAndInclusionFees({
    priorityFeeLamports,
    requestedCostUnits,
}: {
    priorityFeeLamports: number;
    requestedCostUnits: number;
}): readonly ProjectedFee[] {
    return RESOURCE_FEE_RATES.map(rate => {
        const resourceFeeLamports = getResourceFeeLamports({ rate, requestedCostUnits });
        return {
            rate,
            resourceFeeLamports,
            totalFeeLamports: BASE_INCLUSION_FEE_LAMPORTS + priorityFeeLamports + resourceFeeLamports,
        };
    });
}

/**
 * Estimates the cost units SIMD-0553 would charge on, given the cost the RPC reports.
 *
 * `meta.costUnits` is Agave's *executed* transaction cost, not its requested one: a committed
 * transaction's cost is recomputed through `calculate_cost_for_executed_transaction`, whose
 * program-execution term is the compute units actually consumed. SIMD-0553 charges the requested
 * cost, so the consumed compute units are swapped back out for the requested limit — the dominant
 * term, and the whole point of the model: a transaction that requests 200,000 compute units and
 * uses 5,000 is charged for the 200,000.
 *
 * The loaded-accounts-data-size term cannot be corrected the same way. The RPC reports neither the
 * bytes actually loaded nor, before v1, the requested limit, so that term stays at its executed
 * value. A transaction leaving the default 64 MiB limit in place is projected low by up to ~16,000
 * cost units on that term alone, so every figure derived from this is a floor, not an exact charge.
 */
export function estimateRequestedCostUnits({
    computeUnitsConsumed,
    executedCostUnits,
    requestedComputeUnits,
}: {
    computeUnitsConsumed: number;
    executedCostUnits: number;
    requestedComputeUnits: number;
}): number {
    // A transaction cannot consume more than it requested, so the swap can only add cost. The clamp
    // keeps an under-read requested limit, or an inconsistent triple, from projecting below the cost
    // the transaction is already known to have incurred.
    return Math.max(executedCostUnits, executedCostUnits - computeUnitsConsumed + requestedComputeUnits);
}

/**
 * The burned half of the model. The SIMD specifies `ceil_div` over integers, so a transaction that
 * requests any cost at all is charged for it; float division is exact here because a transaction's
 * cost units are bounded by the block limit, orders of magnitude below the safe-integer ceiling.
 */
export function getResourceFeeLamports({
    rate,
    requestedCostUnits,
}: {
    rate: ResourceFeeRate;
    requestedCostUnits: number;
}): number {
    return Math.ceil((requestedCostUnits * rate.numerator) / rate.denominator);
}

/**
 * Backs the priority fee out of a landed transaction's total, so it can be carried into the
 * projection unchanged.
 *
 * `getTransaction` reports one summed `fee`, so the base half has to be subtracted. A transaction
 * carrying precompile signature-verification instructions also pays per precompile signature, which
 * the signature count does not cover — such a transaction's priority fee reads high by 5,000
 * lamports per precompile signature. Prefer the exact figure where the transaction states it: v1
 * declares its total priority fee on the message.
 */
export function derivePriorityFeeLamports({
    feeLamports,
    signatureCount,
}: {
    feeLamports: number;
    signatureCount: number;
}): number {
    return Math.max(0, feeLamports - LAMPORTS_PER_SIGNATURE * signatureCount);
}
