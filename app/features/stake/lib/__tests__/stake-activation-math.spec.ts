import { describe, expect, it } from 'vitest';

import { type Delegation, getStakeActivatingAndDeactivating, type StakeHistoryEntry } from '../stake-activation-math';

// Sentinel deactivation epoch used on chain for stake that has never been deactivated.
const NEVER_DEACTIVATED = 18446744073709551615n;

describe('getStakeActivatingAndDeactivating', () => {
    it('should report no stake when target is before the activation epoch', () => {
        const delegation: Delegation = {
            activationEpoch: 100n,
            deactivationEpoch: NEVER_DEACTIVATED,
            stake: 1_000_000n,
        };
        const result = getStakeActivatingAndDeactivating(delegation, 50n, []);
        expect(result).toEqual({ activating: 0n, deactivating: 0n, effective: 0n });
    });

    it('should report all stake as activating at the activation epoch', () => {
        const delegation: Delegation = {
            activationEpoch: 100n,
            deactivationEpoch: NEVER_DEACTIVATED,
            stake: 1_000_000n,
        };
        const result = getStakeActivatingAndDeactivating(delegation, 100n, []);
        expect(result).toEqual({ activating: 1_000_000n, deactivating: 0n, effective: 0n });
    });

    it('should leave stake fully active when target is between activation and deactivation', () => {
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: 100n, stake: 1_000_000n };
        const result = getStakeActivatingAndDeactivating(delegation, 50n, []);
        expect(result).toEqual({ activating: 0n, deactivating: 0n, effective: 1_000_000n });
    });

    it('should return zero stake when activation epoch equals deactivation epoch', () => {
        // Edge case: stake was activated and instantly deactivated in the same epoch — never had
        // a chance to warm up, so nothing is effective regardless of target_epoch.
        const delegation: Delegation = { activationEpoch: 50n, deactivationEpoch: 50n, stake: 1_000_000n };
        const result = getStakeActivatingAndDeactivating(delegation, 100n, []);
        expect(result).toEqual({ activating: 0n, deactivating: 0n, effective: 0n });
    });

    it('should report all effective stake as deactivating at the deactivation epoch', () => {
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: 10n, stake: 1_000_000n };
        const result = getStakeActivatingAndDeactivating(delegation, 10n, []);
        expect(result).toEqual({ activating: 0n, deactivating: 1_000_000n, effective: 1_000_000n });
    });

    it('should partially deactivate stake within a single cooldown epoch', () => {
        // Mirror of the warmup math: one epoch into cooldown, the 9% cluster cap applies.
        // newlyNotEffective = (currentEffective / deactivating) * (effective * 0.09)
        //                   = (100M / 100M) * (1B * 0.09)
        //                   = 90M
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: 10n, stake: 100_000_000n };
        const history: StakeHistoryEntry[] = [
            { activating: 0n, deactivating: 100_000_000n, effective: 1_000_000_000n, epoch: 10n },
        ];
        const result = getStakeActivatingAndDeactivating(delegation, 11n, history);
        expect(result).toEqual({ activating: 0n, deactivating: 10_000_000n, effective: 10_000_000n });
    });

    it('should fully decay stake past deactivation when no history entry exists for the deactivation epoch', () => {
        // "Dropped out of history" — the runtime treats this as fully decayed.
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: 10n, stake: 1_000_000n };
        const result = getStakeActivatingAndDeactivating(delegation, 100n, []);
        expect(result).toEqual({ activating: 0n, deactivating: 0n, effective: 0n });
    });

    it('should cap effective stake at the delegation amount within a warmup epoch', () => {
        // When the cluster's 9% warmup slice exceeds the remaining delegation, the loop's
        // early-break clamps currentEffectiveStake to delegation.stake.
        // newlyEffective = round((1000/1000) * (1_000_000 * 0.09)) = 90_000, which is > stake (1_000),
        // so currentEffectiveStake is clamped to 1_000 in the same iteration.
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: NEVER_DEACTIVATED, stake: 1_000n };
        const history: StakeHistoryEntry[] = [
            { activating: 1_000n, deactivating: 0n, effective: 1_000_000n, epoch: 0n },
        ];
        const result = getStakeActivatingAndDeactivating(delegation, 1n, history);
        expect(result).toEqual({ activating: 0n, deactivating: 0n, effective: 1_000n });
    });

    it('should reduce effective stake across multiple cooldown epochs', () => {
        // Two-iteration cooldown loop:
        //   epoch 10 → 11: remove round((200K/200K) * (1M * 0.09))   = 90_000  → 110_000 remaining
        //   epoch 11 → 12: remove round((110K/110K) * (910K * 0.09)) = 81_900  → 28_100  remaining
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: 10n, stake: 200_000n };
        const history: StakeHistoryEntry[] = [
            { activating: 0n, deactivating: 200_000n, effective: 1_000_000n, epoch: 10n },
            { activating: 0n, deactivating: 110_000n, effective: 910_000n, epoch: 11n },
        ];
        const result = getStakeActivatingAndDeactivating(delegation, 12n, history);
        expect(result).toEqual({ activating: 0n, deactivating: 28_100n, effective: 28_100n });
    });

    it('should treat the account as fully effective when cluster activating stake is zero', () => {
        // entry.activating === 0n would make weight = Infinity and BigInt(round(Infinity * …))
        // throw RangeError. The guard short-circuits to the delegation amount instead.
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: NEVER_DEACTIVATED, stake: 1_000n };
        const history: StakeHistoryEntry[] = [{ activating: 0n, deactivating: 0n, effective: 1_000_000n, epoch: 0n }];
        const result = getStakeActivatingAndDeactivating(delegation, 1n, history);
        expect(result).toEqual({ activating: 0n, deactivating: 0n, effective: 1_000n });
    });

    it('should reset effective stake to zero when cluster deactivating stake is zero', () => {
        // entry.deactivating === 0n means the account should already be fully undelegated.
        // Without an explicit zero-reset the prior `currentEffectiveStake` would leak through
        // as both deactivating and effective in the return value.
        const delegation: Delegation = { activationEpoch: 0n, deactivationEpoch: 10n, stake: 200_000n };
        const history: StakeHistoryEntry[] = [{ activating: 0n, deactivating: 0n, effective: 1_000_000n, epoch: 10n }];
        const result = getStakeActivatingAndDeactivating(delegation, 11n, history);
        expect(result).toEqual({ activating: 0n, deactivating: 0n, effective: 0n });
    });
});
