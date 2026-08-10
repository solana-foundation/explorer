import { array, boolean, Infer, integer, min, number, type } from 'superstruct';

/**
 * One epoch's inflation reward for a stake account.
 *
 * `type` (not `object`) is deliberate: Solscan returns more fields than we read — `commission`,
 * `post_balance`, `effective_slot` — and adding another must not fail validation.
 */
export type SolscanStakeReward = Infer<typeof SolscanStakeReward>;
export const SolscanStakeReward = type({
    // Base units scaled by `decimals`, so lamports for SOL. Not a SOL-denominated float.
    // Constrained to a non-negative integer so the running total only ever grows, which is what
    // makes a single safe-integer check on the final sum enough to prove no add lost precision.
    amount: min(integer(), 0),
    decimals: number(),
    epoch: number(),
});

export type SolscanStakeRewardResponse = Infer<typeof SolscanStakeRewardResponse>;
export const SolscanStakeRewardResponse = type({
    data: array(SolscanStakeReward),
    success: boolean(),
});
