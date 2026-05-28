import { epochCountdown } from '../lib/epoch-countdown';

const SLOTS_PER_EPOCH = 432_000n;
const MS_PER_SLOT = 400;

describe('epochCountdown', () => {
    it('should return undefined when the target epoch has already passed', () => {
        const result = epochCountdown({
            currentEpoch: 800n,
            msPerSlot: MS_PER_SLOT,
            slotIndex: 0n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 750,
        });

        expect(result).toBeUndefined();
    });

    it('should return undefined when the target epoch equals the current epoch', () => {
        const result = epochCountdown({
            currentEpoch: 800n,
            msPerSlot: MS_PER_SLOT,
            slotIndex: 100n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 800,
        });

        expect(result).toBeUndefined();
    });

    it('should count remaining time within the current epoch when target is next epoch', () => {
        // 1000 slots remain in the current epoch → 1000 * 400 ms = 400 000 ms = 6m 40s
        const result = epochCountdown({
            currentEpoch: 800n,
            msPerSlot: MS_PER_SLOT,
            slotIndex: SLOTS_PER_EPOCH - 1000n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 801,
        });

        expect(result).toBe('6m 40s');
    });

    it('should add full future epochs when target is several epochs away', () => {
        // current: 0 slots in → 432 000 slots left this epoch.
        // 2 full future epochs before target → 2 * 432 000 = 864 000 slots.
        // total: 1 296 000 slots * 400 ms = 518 400 000 ms = 6 days.
        const result = epochCountdown({
            currentEpoch: 800n,
            msPerSlot: MS_PER_SLOT,
            slotIndex: 0n,
            slotsInEpoch: SLOTS_PER_EPOCH,
            slotsPerEpoch: SLOTS_PER_EPOCH,
            targetEpoch: 803,
        });

        expect(result).toBe('6d');
    });
});
