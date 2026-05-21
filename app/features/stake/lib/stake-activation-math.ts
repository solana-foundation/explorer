// Pure replay of the Solana runtime's stake warmup/cooldown schedule. Kept close to a line-for-line
// translation of the upstream Rust so divergences with the protocol are easy to spot — do not
// refactor the parallel structure of the two iterative loops.
//
// See ../api/stake-activation.ts for the surrounding RPC fetcher and why this math has to live
// in client code at all.

export type Delegation = {
    stake: bigint;
    activationEpoch: bigint;
    deactivationEpoch: bigint;
};

export type StakeHistoryEntry = {
    epoch: bigint;
    effective: bigint;
    activating: bigint;
    deactivating: bigint;
};

export interface StakeActivatingAndDeactivating {
    effective: bigint;
    activating: bigint;
    deactivating: bigint;
}

interface EffectiveAndActivating {
    effective: bigint;
    activating: bigint;
}

const WARMUP_COOLDOWN_RATE = 0.09;

export function getStakeActivatingAndDeactivating(
    delegation: Delegation,
    targetEpoch: bigint,
    stakeHistory: StakeHistoryEntry[],
): StakeActivatingAndDeactivating {
    // Index the history once so the per-epoch lookups inside the warmup/cooldown loops are O(1)
    // instead of O(n); a full sysvar carries 512 entries and a long warmup made it O(n²).
    const stakeHistoryMap = buildStakeHistoryMap(stakeHistory);
    const { effective, activating } = getStakeAndActivating(delegation, targetEpoch, stakeHistoryMap);

    // then de-activate some portion if necessary
    if (targetEpoch < delegation.deactivationEpoch) {
        return { activating, deactivating: 0n, effective };
    } else if (targetEpoch === delegation.deactivationEpoch) {
        // can only deactivate what's activated
        return { activating: 0n, deactivating: effective, effective };
    }
    let currentEpoch = delegation.deactivationEpoch;
    let entry = getStakeHistoryEntry(currentEpoch, stakeHistoryMap);
    if (entry !== null) {
        // target_epoch > self.activation_epoch
        // loop from my deactivation epoch until the target epoch
        // current effective stake is updated using its previous epoch's cluster stake
        let currentEffectiveStake = effective;
        while (entry !== null) {
            currentEpoch++;
            // If no cluster-wide deactivating stake at this epoch the account is already
            // fully undelegated. Reset explicitly (the upstream Rust returns `(0, 0, 0)` here)
            // and also guard the divide-by-zero in the weight calculation below.
            if (entry.deactivating === 0n) {
                currentEffectiveStake = 0n;
                break;
            }

            // I'm trying to get to zero, how much of the deactivation in stake
            //   this account is entitled to take
            const weight = Number(currentEffectiveStake) / Number(entry.deactivating);

            // portion of newly not-effective cluster stake I'm entitled to at current epoch
            const newlyNotEffectiveClusterStake = Number(entry.effective) * WARMUP_COOLDOWN_RATE;
            const newlyNotEffectiveStake = BigInt(Math.max(1, Math.round(weight * newlyNotEffectiveClusterStake)));

            currentEffectiveStake -= newlyNotEffectiveStake;
            if (currentEffectiveStake <= 0n) {
                currentEffectiveStake = 0n;
                break;
            }

            if (currentEpoch >= targetEpoch) {
                break;
            }
            entry = getStakeHistoryEntry(currentEpoch, stakeHistoryMap);
        }

        // deactivating stake should equal to all of currently remaining effective stake
        return {
            activating: 0n,
            deactivating: currentEffectiveStake,
            effective: currentEffectiveStake,
        };
    } else {
        return { activating: 0n, deactivating: 0n, effective: 0n };
    }
}

function getStakeAndActivating(
    delegation: Delegation,
    targetEpoch: bigint,
    stakeHistoryMap: Map<bigint, StakeHistoryEntry>,
): EffectiveAndActivating {
    if (delegation.activationEpoch === delegation.deactivationEpoch) {
        // activated but instantly deactivated; no stake at all regardless of target_epoch
        return { activating: 0n, effective: 0n };
    } else if (targetEpoch === delegation.activationEpoch) {
        // all is activating
        return { activating: delegation.stake, effective: 0n };
    } else if (targetEpoch < delegation.activationEpoch) {
        // not yet enabled
        return { activating: 0n, effective: 0n };
    }

    let currentEpoch = delegation.activationEpoch;
    let entry = getStakeHistoryEntry(currentEpoch, stakeHistoryMap);
    if (entry !== null) {
        // target_epoch > self.activation_epoch

        // loop from my activation epoch until the target epoch summing up my entitlement
        // current effective stake is updated using its previous epoch's cluster stake
        let currentEffectiveStake = 0n;
        while (entry !== null) {
            currentEpoch++;
            const remaining = delegation.stake - currentEffectiveStake;
            // If no cluster-wide activating stake at this epoch the warmup cap doesn't apply
            // — the account's remaining delegation is treated as fully effective. This also
            // guards against `Number(remaining) / Number(0n) = Infinity` flowing into BigInt().
            if (entry.activating === 0n) {
                currentEffectiveStake = delegation.stake;
                break;
            }
            const weight = Number(remaining) / Number(entry.activating);
            const newlyEffectiveClusterStake = Number(entry.effective) * WARMUP_COOLDOWN_RATE;
            const newlyEffectiveStake = BigInt(Math.max(1, Math.round(weight * newlyEffectiveClusterStake)));

            currentEffectiveStake += newlyEffectiveStake;
            if (currentEffectiveStake >= delegation.stake) {
                currentEffectiveStake = delegation.stake;
                break;
            }

            if (currentEpoch >= targetEpoch || currentEpoch >= delegation.deactivationEpoch) {
                break;
            }
            entry = getStakeHistoryEntry(currentEpoch, stakeHistoryMap);
        }
        return {
            activating: delegation.stake - currentEffectiveStake,
            effective: currentEffectiveStake,
        };
    } else {
        // no history or I've dropped out of history, so assume fully effective
        return { activating: 0n, effective: delegation.stake };
    }
}

function buildStakeHistoryMap(stakeHistory: StakeHistoryEntry[]): Map<bigint, StakeHistoryEntry> {
    const map = new Map<bigint, StakeHistoryEntry>();
    for (const entry of stakeHistory) {
        map.set(entry.epoch, entry);
    }
    return map;
}

function getStakeHistoryEntry(
    epoch: bigint,
    stakeHistoryMap: Map<bigint, StakeHistoryEntry>,
): StakeHistoryEntry | null {
    return stakeHistoryMap.get(epoch) ?? null;
}
