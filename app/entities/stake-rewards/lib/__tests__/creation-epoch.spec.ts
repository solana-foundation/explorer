import { describe, expect, it } from 'vitest';

import { getCreationEpoch } from '../creation-epoch';

describe('getCreationEpoch', () => {
    it('should place the oldest slot in the epoch that contains it', () => {
        // Measured on mainnet-beta: `116vkzEjoTpFEd3x12XL9HbYJ5EpoC4cZ9a1N5A5mUt` was created in
        // slot 407,506,361, which is epoch 943 — the epoch it was also delegated in.
        expect(getCreationEpoch(makeInput(407_506_361n))).toBe(943);
    });

    it('should date a re-delegated account from creation, not from its latest delegation', () => {
        // `MCrWxQJgT3VogbgM5sy78K4uCEmwPQiKeXG2Bna51zs` reports `activationEpoch` 1005 but was
        // created in slot 364,763,481, in epoch 844. Sweeping from 844 recovers 55,208,535 lamports
        // against the 10,482,997 that epoch 1005 would have reported.
        expect(getCreationEpoch(makeInput(364_763_481n))).toBe(844);
    });

    it('should return the current epoch for an account created in it', () => {
        expect(getCreationEpoch(makeInput(437_750_000n))).toBe(1013);
    });

    it('should return the previous epoch for the last slot before the current one', () => {
        // 437,616,000 is the first slot of epoch 1013, so one slot earlier is still epoch 1012.
        expect(getCreationEpoch(makeInput(437_615_999n))).toBe(1012);
    });

    it('should return the current epoch for the first slot of the current epoch', () => {
        expect(getCreationEpoch(makeInput(437_616_000n))).toBe(1013);
    });
});

/** `getEpochInfo` as measured on mainnet-beta during epoch 1013. */
function makeInput(oldestSlot: bigint) {
    return {
        epochInfo: {
            absoluteSlot: 437_750_351n,
            epoch: 1013n,
            slotIndex: 134_351n,
            slotsInEpoch: 432_000n,
        },
        oldestSlot,
    };
}
