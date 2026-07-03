import { EpochSchedule } from '@utils/epoch-schedule';

interface EpochInfo {
    absoluteSlot: bigint;
    blockHeight: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
}

// Live ledger info. Fetched lazily by useClusterInfo(), decoupled from connection
// status so routes that don't render it (e.g. the transaction inspector) never fetch it.
export interface ClusterInfo {
    firstAvailableBlock: bigint;
    epochSchedule: EpochSchedule;
    epochInfo: EpochInfo;
}
