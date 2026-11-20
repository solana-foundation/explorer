import { describe, expect, it } from 'vitest';

import { gen } from '../../../__tests__/gen.js';
import { getReservedComputeUnits } from '../reserve-schedule.js';

describe('getReservedComputeUnits', () => {
    it('should reserve the default cu for a BPF program', () => {
        expect(getReservedComputeUnits({ cluster: 'mainnet-beta', epoch: 1000n, programAddress: gen.address(1) })).toBe(
            200_000,
        );
    });

    it.each([
        { cluster: 'mainnet-beta', epoch: 759n },
        { cluster: 'devnet', epoch: 842n },
        { cluster: 'testnet', epoch: 750n },
    ] as const)(
        'should reserve the minimal cu for a builtin when $cluster reaches the gate at epoch $epoch',
        ({ cluster, epoch }) => {
            expect(getReservedComputeUnits({ cluster, epoch, programAddress: gen.systemProgram })).toBe(3_000);
        },
    );

    it.each([
        { cluster: 'mainnet-beta', epoch: 758n },
        { cluster: 'devnet', epoch: 841n },
        { cluster: 'testnet', epoch: 749n },
    ] as const)(
        'should reserve the default cu for a builtin when $cluster is at epoch $epoch, before the gate',
        ({ cluster, epoch }) => {
            expect(getReservedComputeUnits({ cluster, epoch, programAddress: gen.systemProgram })).toBe(200_000);
        },
    );

    it('should apply the newest configuration when the cluster is custom', () => {
        expect(getReservedComputeUnits({ cluster: 'custom', programAddress: gen.systemProgram })).toBe(3_000);
    });

    it('should reserve the default cu for a builtin when the epoch is absent', () => {
        expect(getReservedComputeUnits({ cluster: 'mainnet-beta', programAddress: gen.systemProgram })).toBe(200_000);
    });
});
