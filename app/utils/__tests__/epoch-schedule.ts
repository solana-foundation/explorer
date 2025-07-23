import { Cluster } from '../cluster';
import { EpochSchedule, getEpochForSlot, getFirstSlotInEpoch, getLastSlotInEpoch, getMaxComputeUnitsInBlock } from '../epoch-schedule';

describe('getEpoch', () => {
    it('returns the correct epoch for a slot after `firstNormalSlot`', () => {
        const schedule: EpochSchedule = {
            firstNormalEpoch: 0n,
            firstNormalSlot: 0n,
            slotsPerEpoch: 432_000n,
        };

        expect(getEpochForSlot(schedule, 1n)).toEqual(0n);
        expect(getEpochForSlot(schedule, 431_999n)).toEqual(0n);
        expect(getEpochForSlot(schedule, 432_000n)).toEqual(1n);
        expect(getEpochForSlot(schedule, 500_000n)).toEqual(1n);
        expect(getEpochForSlot(schedule, 228_605_332n)).toEqual(529n);
    });

    it('returns the correct epoch for a slot before `firstNormalSlot`', () => {
        const schedule: EpochSchedule = {
            firstNormalEpoch: 100n,
            firstNormalSlot: 3_200n,
            slotsPerEpoch: 432_000n,
        };

        expect(getEpochForSlot(schedule, 1n)).toEqual(0n);
        expect(getEpochForSlot(schedule, 31n)).toEqual(0n);
        expect(getEpochForSlot(schedule, 32n)).toEqual(1n);
    });
});

describe('getFirstSlotInEpoch', () => {
    it('returns the first slot for an epoch after `firstNormalEpoch`', () => {
        const schedule: EpochSchedule = {
            firstNormalEpoch: 0n,
            firstNormalSlot: 0n,
            slotsPerEpoch: 100n,
        };

        expect(getFirstSlotInEpoch(schedule, 1n)).toEqual(100n);
        expect(getFirstSlotInEpoch(schedule, 2n)).toEqual(200n);
        expect(getFirstSlotInEpoch(schedule, 10n)).toEqual(1000n);
    });

    it('returns the first slot for an epoch before `firstNormalEpoch`', () => {
        const schedule: EpochSchedule = {
            firstNormalEpoch: 100n,
            firstNormalSlot: 100_000n,
            slotsPerEpoch: 100n,
        };

        expect(getFirstSlotInEpoch(schedule, 0n)).toEqual(0n);
        expect(getFirstSlotInEpoch(schedule, 1n)).toEqual(32n);
        expect(getFirstSlotInEpoch(schedule, 2n)).toEqual(96n);
        expect(getFirstSlotInEpoch(schedule, 10n)).toEqual(32_736n);
    });
});

describe('getLastSlotInEpoch', () => {
    it('returns the last slot for an epoch after `firstNormalEpoch`', () => {
        const schedule: EpochSchedule = {
            firstNormalEpoch: 0n,
            firstNormalSlot: 0n,
            slotsPerEpoch: 100n,
        };

        expect(getLastSlotInEpoch(schedule, 1n)).toEqual(199n);
        expect(getLastSlotInEpoch(schedule, 2n)).toEqual(299n);
        expect(getLastSlotInEpoch(schedule, 10n)).toEqual(1099n);
    });

    it('returns the first slot for an epoch before `firstNormalEpoch`', () => {
        const schedule: EpochSchedule = {
            firstNormalEpoch: 100n,
            firstNormalSlot: 100_000n,
            slotsPerEpoch: 100n,
        };

        expect(getLastSlotInEpoch(schedule, 0n)).toEqual(31n);
        expect(getLastSlotInEpoch(schedule, 1n)).toEqual(95n);
        expect(getLastSlotInEpoch(schedule, 2n)).toEqual(223n);
        expect(getLastSlotInEpoch(schedule, 10n)).toEqual(65_503n);
    });
});

describe('getMaxComputeUnitsForEpoch', () => {
    it('returns the correct max compute units for an epoch on mainnet', () => {
        expect(getMaxComputeUnitsInBlock({epoch: 0n, cluster: Cluster.MainnetBeta})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 769n, cluster: Cluster.MainnetBeta})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 770n, cluster: Cluster.MainnetBeta})).toEqual(50_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 821n, cluster: Cluster.MainnetBeta})).toEqual(50_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 822n, cluster: Cluster.MainnetBeta})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 823n, cluster: Cluster.MainnetBeta})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: undefined, cluster: Cluster.MainnetBeta})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: -1n, cluster: Cluster.MainnetBeta})).toEqual(48_000_000);
    });

    it('returns the correct max compute units for an epoch on devnet', () => {
        expect(getMaxComputeUnitsInBlock({epoch: 0n, cluster: Cluster.Devnet})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 856n, cluster: Cluster.Devnet})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 857n, cluster: Cluster.Devnet})).toEqual(50_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 914n, cluster: Cluster.Devnet})).toEqual(50_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 915n, cluster: Cluster.Devnet})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 916n, cluster: Cluster.Devnet})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: undefined, cluster: Cluster.Devnet})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: -1n, cluster: Cluster.Devnet})).toEqual(48_000_000);
    });

    it('returns the correct max compute units for an epoch on testnet', () => {
        expect(getMaxComputeUnitsInBlock({epoch: 0n, cluster: Cluster.Testnet})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 763n, cluster: Cluster.Testnet})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 764n, cluster: Cluster.Testnet})).toEqual(50_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 811n, cluster: Cluster.Testnet})).toEqual(50_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 812n, cluster: Cluster.Testnet})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 813n, cluster: Cluster.Testnet})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: undefined, cluster: Cluster.Testnet})).toEqual(48_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: -1n, cluster: Cluster.Testnet})).toEqual(48_000_000);
    });

    it('returns the correct max compute units for an epoch on custom', () => {
        expect(getMaxComputeUnitsInBlock({epoch: 0n, cluster: Cluster.Custom})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 769n, cluster: Cluster.Custom})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 770n, cluster: Cluster.Custom})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 821n, cluster: Cluster.Custom})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 822n, cluster: Cluster.Custom})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: 823n, cluster: Cluster.Custom})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: undefined, cluster: Cluster.Custom})).toEqual(60_000_000);
        expect(getMaxComputeUnitsInBlock({epoch: -1n, cluster: Cluster.Custom})).toEqual(60_000_000);
    });
});