import { estimateTimeUntilEpoch } from '../lib/epoch-countdown';

const SLOTS_PER_EPOCH = 432_000n;
// The rate every countdown used before it was measured per cluster.
const LEGACY_MS_PER_SLOT = 400;

describe('estimateTimeUntilEpoch', () => {
    it('should return undefined when the target epoch has already passed', () => {
        const result = estimateTimeUntilEpoch({
            currentEpoch: 800n,
            msPerSlot: LEGACY_MS_PER_SLOT,
            slotIndex: 0n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 750,
        });

        expect(result).toBeUndefined();
    });

    it('should return undefined when the target epoch equals the current epoch', () => {
        const result = estimateTimeUntilEpoch({
            currentEpoch: 800n,
            msPerSlot: LEGACY_MS_PER_SLOT,
            slotIndex: 100n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 800,
        });

        expect(result).toBeUndefined();
    });

    it('should count remaining time within the current epoch when target is next epoch', () => {
        // 1000 slots remain in the current epoch → 1000 * 400 ms = 400 000 ms = 6m 40s
        const result = estimateTimeUntilEpoch({
            currentEpoch: 800n,
            msPerSlot: LEGACY_MS_PER_SLOT,
            slotIndex: SLOTS_PER_EPOCH - 1000n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 801,
        });

        expect(result).toBe('6m 40s');
    });

    // The rate is the caller's to measure: clusters ran anywhere from 166 ms to 314 ms a slot as
    // SIMD-0525 stepped through them, and the same slot count has to read differently at each.
    it('should scale the estimate by the rate it is given', () => {
        const input = {
            currentEpoch: 800n,
            slotIndex: SLOTS_PER_EPOCH - 1000n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 801,
        };

        expect(estimateTimeUntilEpoch({ ...input, msPerSlot: 200 })).toBe('3m 20s');
        expect(estimateTimeUntilEpoch({ ...input, msPerSlot: LEGACY_MS_PER_SLOT })).toBe('6m 40s');
    });

    it('should add full future epochs when target is several epochs away', () => {
        // current: 0 slots in → 432 000 slots left this epoch.
        // 2 full future epochs before target → 2 * 432 000 = 864 000 slots.
        // total: 1 296 000 slots * 400 ms = 518 400 000 ms = 6 days.
        const result = estimateTimeUntilEpoch({
            currentEpoch: 800n,
            msPerSlot: LEGACY_MS_PER_SLOT,
            slotIndex: 0n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 803,
        });

        expect(result).toBe('6d');
    });
});
