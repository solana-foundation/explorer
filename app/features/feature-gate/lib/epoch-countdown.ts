import { MS_PER_SLOT, slotsToHumanString } from '@/app/utils';

type EpochCountdownInput = {
    targetEpoch: number;
    currentEpoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
    slotsPerEpoch: bigint;
    msPerSlot?: number;
};

/**
 * Estimate the time until `targetEpoch` begins on the cluster described by the
 * other inputs. Returns `undefined` when the target epoch isn't strictly in
 * the future (already activated or activating in the current epoch).
 */
export function epochCountdown(input: EpochCountdownInput): string | undefined {
    const { targetEpoch, currentEpoch, slotIndex, slotsInEpoch, slotsPerEpoch, msPerSlot = MS_PER_SLOT } = input;

    const target = BigInt(targetEpoch);
    if (target <= currentEpoch) return undefined;

    const slotsLeftInCurrent = slotsInEpoch - slotIndex;
    const fullFutureEpochs = target - currentEpoch - 1n;
    const totalSlots = slotsLeftInCurrent + fullFutureEpochs * slotsPerEpoch;

    return slotsToHumanString(Number(totalSlots), msPerSlot);
}
