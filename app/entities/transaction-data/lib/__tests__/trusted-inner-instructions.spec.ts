import { Cluster } from '@utils/cluster';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';
import { describe, expect, it } from 'vitest';

import { trustedInnerInstructions } from '../trusted-inner-instructions';

const GROUPS = [{ index: 0 }];

describe('trustedInnerInstructions', () => {
    it('should report nothing for a mainnet slot before inner instructions were recorded', () => {
        expect(
            trustedInnerInstructions(GROUPS, {
                cluster: Cluster.MainnetBeta,
                slot: INNER_INSTRUCTIONS_START_SLOT - 1,
            }),
        ).toBeUndefined();
    });

    it('should report the groups from the first mainnet slot that recorded them', () => {
        expect(
            trustedInnerInstructions(GROUPS, { cluster: Cluster.MainnetBeta, slot: INNER_INSTRUCTIONS_START_SLOT }),
        ).toBe(GROUPS);
    });

    it('should report the groups on other clusters whatever the slot', () => {
        for (const cluster of [Cluster.Devnet, Cluster.Testnet, Cluster.Custom]) {
            expect(trustedInnerInstructions(GROUPS, { cluster, slot: 1 })).toBe(GROUPS);
        }
    });

    it('should report nothing when the source supplied no slot to check against', () => {
        // An absent slot reaches this as `NaN`, which passes a range check rather than failing one.
        expect(trustedInnerInstructions(GROUPS, { cluster: Cluster.MainnetBeta, slot: NaN })).toBeUndefined();
    });

    it('should keep an absent list absent rather than reporting an empty one', () => {
        // The RPC types spell an absent list `null`, the inspector's own path `undefined`.
        expect(trustedInnerInstructions(null, { cluster: Cluster.Devnet, slot: 1 })).toBeUndefined();
        expect(trustedInnerInstructions(undefined, { cluster: Cluster.Devnet, slot: 1 })).toBeUndefined();
    });
});
