import { measureMsPerSlot } from '@entities/slot-time';

import { ClusterStatsStatus } from './solanaClusterStats';
import { PerformanceSample } from './solanaPerformanceInfo';

/** Each sample covers one minute, so an hour of history is 60 of them. */
const SAMPLES_PER_HOUR = 60;
const SAMPLES_PER_MINUTE = 1;

export type DashboardInfo = {
    status: ClusterStatsStatus;
    msPerSlot_1h: number;
    msPerSlot_1min?: number;
    epochInfo: EpochInfo;
    blockTime?: number;
    lastBlockTime?: BlockTimeInfo;
};

export type BlockTimeInfo = {
    blockTime: number;
    slot: bigint;
};

export enum DashboardInfoActionType {
    SetPerfSamples,
    SetEpochInfo,
    SetLastBlockTime,
    SetError,
    Reset,
}

export type EpochInfo = {
    absoluteSlot: bigint;
    blockHeight: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
};

export type DashboardInfoActionSetPerfSamples = {
    type: DashboardInfoActionType.SetPerfSamples;
    data: PerformanceSample[];
};

export type DashboardInfoActionSetEpochInfo = {
    type: DashboardInfoActionType.SetEpochInfo;
    data: EpochInfo;
};

export type DashboardInfoActionReset = {
    type: DashboardInfoActionType.Reset;
    data: DashboardInfo;
};

export type DashboardInfoActionSetError = {
    type: DashboardInfoActionType.SetError;
    data: string;
};

export type DashboardInfoActionSetLastBlockTime = {
    type: DashboardInfoActionType.SetLastBlockTime;
    data: BlockTimeInfo;
};

export type DashboardInfoAction =
    | DashboardInfoActionSetPerfSamples
    | DashboardInfoActionSetEpochInfo
    | DashboardInfoActionReset
    | DashboardInfoActionSetError
    | DashboardInfoActionSetLastBlockTime;

export function dashboardInfoReducer(state: DashboardInfo, action: DashboardInfoAction) {
    switch (action.type) {
        case DashboardInfoActionType.SetLastBlockTime: {
            const blockTime = state.blockTime || action.data.blockTime;
            return {
                ...state,
                blockTime,
                lastBlockTime: action.data,
            };
        }

        case DashboardInfoActionType.SetPerfSamples: {
            const msPerSlot_1h = measureMsPerSlot(action.data, SAMPLES_PER_HOUR);
            const msPerSlot_1min = measureMsPerSlot(action.data, SAMPLES_PER_MINUTE);

            // A stalled cluster produces no slot for the newest minute while the hour still states a
            // rate. Labelling an older minute "1min" would misreport it, so it goes absent instead.
            if (msPerSlot_1h === undefined) {
                return state;
            }

            const status =
                state.epochInfo.absoluteSlot !== BigInt(0) ? ClusterStatsStatus.Ready : ClusterStatsStatus.Loading;

            return {
                ...state,
                msPerSlot_1h,
                msPerSlot_1min,
                status,
            };
        }

        case DashboardInfoActionType.SetEpochInfo: {
            const status = state.msPerSlot_1h !== 0 ? ClusterStatsStatus.Ready : ClusterStatsStatus.Loading;

            let blockTime = state.blockTime;

            // interpolate blocktime based on last known blocktime and average slot time
            if (
                state.lastBlockTime &&
                state.msPerSlot_1h !== 0 &&
                action.data.absoluteSlot >= state.lastBlockTime.slot
            ) {
                blockTime = Number(
                    BigInt(state.lastBlockTime.blockTime) +
                        (action.data.absoluteSlot - state.lastBlockTime.slot) * BigInt(state.msPerSlot_1h),
                );
            }

            return {
                ...state,
                blockTime,
                epochInfo: action.data,
                status,
            };
        }

        case DashboardInfoActionType.SetError:
            return {
                ...state,
                status: ClusterStatsStatus.Error,
            };

        case DashboardInfoActionType.Reset:
            return {
                ...action.data,
            };

        default:
            return state;
    }
}
