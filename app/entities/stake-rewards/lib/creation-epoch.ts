/** The fields of `getEpochInfo` that place a slot in an epoch. */
type EpochInfo = {
    absoluteSlot: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
};

/**
 * The epoch a stake account was created in, from the slot of its oldest signature.
 *
 * This is what bounds the reward sweep from below, because `delegation.activationEpoch` does not:
 * re-delegating resets it to the epoch of the *latest* delegation, discarding the account's earlier
 * earning history. An account cannot be paid a reward before it exists, so its first signature is a
 * correct floor — and a far tighter one than the cluster's first reward epoch, which no long-lived
 * account can sweep inside the route's budget.
 *
 * Anchors on the current epoch rather than dividing the slot by the epoch length, so no cluster's
 * epoch length has to be hardcoded. It assumes every epoch since the account's first is the same
 * length, which holds once a cluster is past its warmup epochs. An account older than that gets an
 * epoch that is too low, which only widens the sweep — the caller floors it at the cluster's first
 * reward epoch anyway.
 */
export function getCreationEpoch({ epochInfo, oldestSlot }: { epochInfo: EpochInfo; oldestSlot: bigint }): number {
    const { absoluteSlot, epoch, slotIndex, slotsInEpoch } = epochInfo;

    const currentEpochFirstSlot = absoluteSlot - slotIndex;
    if (oldestSlot >= currentEpochFirstSlot) {
        return Number(epoch);
    }

    // Rounded up, because a slot anywhere inside an epoch belongs to that whole epoch.
    const epochsBack = (currentEpochFirstSlot - oldestSlot + slotsInEpoch - 1n) / slotsInEpoch;
    return Number(epoch - epochsBack);
}
