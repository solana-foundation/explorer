import { EpochSchedule } from '@utils/epoch-schedule';

export interface EpochInfo {
    absoluteSlot: bigint;
    blockHeight: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
}

export interface ClusterInfo {
    epochSchedule: EpochSchedule;
    epochInfo: EpochInfo;
}
