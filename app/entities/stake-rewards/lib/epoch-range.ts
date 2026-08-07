import { Cluster } from '@utils/cluster';

export type RewardEpochRange = {
    fromEpoch: number;
    toEpoch: number;
};

/**
 * Inflation rewards began in these epochs, so no earlier epoch can hold a reward.
 * Clusters absent from the map have no floor.
 */
const FIRST_REWARD_EPOCH = new Map<Cluster, number>([
    [Cluster.MainnetBeta, 132],
    [Cluster.Testnet, 43],
]);

/**
 * The epochs whose inflation rewards make up a stake account's lifetime total.
 *
 * Returns `undefined` when the account has no completed reward epochs yet — a stake account
 * delegated this epoch, or one that deactivated before its first reward. That is a total of
 * zero, not a failure; callers must not treat it as an error.
 *
 * `deactivationEpoch` is `undefined` when the account is still delegated. Callers normalise
 * the `u64::MAX` sentinel away, as `DelegationCard` already does.
 *
 * The range starts at `creationEpoch` and never at `delegation.activationEpoch`. Re-delegating
 * resets the activation epoch to the epoch of the latest delegation, so it is not the account's
 * first earning epoch — measured at 81% of one account's total left out. There is no fallback: a
 * caller that cannot date the account must fail rather than pass a later epoch, because a later
 * start yields a total short by an unknown amount that reads as a correct one.
 */
export function getRewardEpochRange({
    cluster,
    creationEpoch,
    currentEpoch,
    deactivationEpoch,
}: {
    cluster: Cluster;
    creationEpoch: number;
    currentEpoch: number;
    deactivationEpoch?: number;
}): RewardEpochRange | undefined {
    const fromEpoch = Math.max(creationEpoch, FIRST_REWARD_EPOCH.get(cluster) ?? 0);

    // The current epoch has not finished, so it has paid nothing yet.
    const lastCompletedEpoch = currentEpoch - 1;

    // A caller that forgets to strip the u64::MAX sentinel would otherwise pass a number far
    // beyond any real epoch. Treat anything past the safe integer range as "still delegated".
    const isDeactivated = deactivationEpoch !== undefined && deactivationEpoch < Number.MAX_SAFE_INTEGER;
    const toEpoch = isDeactivated ? Math.min(lastCompletedEpoch, deactivationEpoch) : lastCompletedEpoch;

    if (fromEpoch > toEpoch) {
        return undefined;
    }

    return { fromEpoch, toEpoch };
}
