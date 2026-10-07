import { describe, expect, it } from 'vitest';

import { mockEpochInfo } from '@/app/__tests__/mock-rpc';

import { ClusterStatsStatus } from '../solanaClusterStats';
import {
    BlockTimeInfo,
    DashboardInfo,
    DashboardInfoAction,
    DashboardInfoActionType,
    dashboardInfoReducer,
} from '../solanaDashboardInfo';
import { PerformanceSample } from '../solanaPerformanceInfo';

describe('dashboardInfoReducer', () => {
    const createInitialState = (overrides?: Partial<DashboardInfo>): DashboardInfo => ({
        epochInfo: {
            absoluteSlot: BigInt(0),
            blockHeight: BigInt(0),
            epoch: BigInt(0),
            slotIndex: BigInt(0),
            slotsInEpoch: BigInt(0),
        },
        msPerSlot_1h: 0,
        status: ClusterStatsStatus.Loading,
        ...overrides,
    });

    describe('SetLastBlockTime', () => {
        const blockTimeInfo: BlockTimeInfo = { blockTime: 1234567890, slot: BigInt(1000) };

        it('should update lastBlockTime and set blockTime when state has no blockTime', () => {
            const initialState = createInitialState();

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetLastBlockTime, blockTimeInfo),
            );

            expect(result).toEqual({
                ...initialState,
                blockTime: 1234567890,
                lastBlockTime: blockTimeInfo,
            });
        });

        it('should preserve existing blockTime when state already has blockTime', () => {
            const initialState = createInitialState({ blockTime: 999999999 });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetLastBlockTime, blockTimeInfo),
            );

            expect(result.lastBlockTime).toEqual(blockTimeInfo);
            expect(result.blockTime).toBe(999999999); // Preserved from state
        });

        it('should update lastBlockTime even when it already exists', () => {
            const existingBlockTime: BlockTimeInfo = {
                blockTime: 1000000000,
                slot: BigInt(500),
            };
            const initialState = createInitialState({
                blockTime: 1000000000,
                lastBlockTime: existingBlockTime,
            });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetLastBlockTime, blockTimeInfo),
            );

            expect(result.lastBlockTime).toEqual(blockTimeInfo);
        });
    });

    describe('SetPerfSamples', () => {
        it('should return state unchanged when data array is empty', () => {
            const initialState = createInitialState();

            const result = dashboardInfoReducer(initialState, action(DashboardInfoActionType.SetPerfSamples, []));

            expect(result).toBe(initialState);
        });

        it('should return state unchanged when all samples have zero numSlots', () => {
            const initialState = createInitialState();

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetPerfSamples, [sample(0), sample(0)]),
            );

            expect(result).toBe(initialState);
        });

        it('should calculate msPerSlot_1h and msPerSlot_1min correctly with single sample', () => {
            const result = dashboardInfoReducer(
                createInitialState(),
                action(DashboardInfoActionType.SetPerfSamples, [sample(10)]),
            );

            expect(result.msPerSlot_1h).toBe(6000); // 60 s / 10 slots
            expect(result.msPerSlot_1min).toBe(6000); // 60 s / 10 slots
        });

        it('should measure msPerSlot_1h over all samples when less than 60', () => {
            const initialState = createInitialState({ epochInfo: mockEpochInfo({ absoluteSlot: BigInt(1000) }) });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetPerfSamples, [sample(10), sample(20), sample(30)]),
            );

            // 180 s over 60 slots. Not the mean of the three rates, (6000 + 3000 + 2000) / 3 = 3667 ms:
            // the slow minute produced 10 of the 60 slots, so it is a sixth of the answer, not a third.
            expect(result.msPerSlot_1h).toBe(3000);
            expect(result.msPerSlot_1min).toBe(6000); // Newest sample: 60 s / 10 slots
            expect(result.status).toBe(ClusterStatsStatus.Ready); // epochInfo.absoluteSlot is not 0
        });

        it('should limit samples to 60 when more than 60 samples provided', () => {
            const withinTheHour = Array.from({ length: 60 }, () => sample(10));
            const older = Array.from({ length: 40 }, () => sample(1));

            const result = dashboardInfoReducer(
                createInitialState(),
                action(DashboardInfoActionType.SetPerfSamples, [...withinTheHour, ...older]),
            );

            // The 40 older minutes would drag the rate up if the window did not stop at 60.
            expect(result.msPerSlot_1h).toBe(6000); // 60 s / 10 slots
            expect(result.msPerSlot_1min).toBe(6000); // Newest sample: 60 s / 10 slots
        });

        it('should skip a minute that produced no slot', () => {
            const result = dashboardInfoReducer(
                createInitialState(),
                action(DashboardInfoActionType.SetPerfSamples, [sample(10), sample(0)]),
            );

            expect(result.msPerSlot_1h).toBe(6000); // 60 s / 10 slots
            expect(result.msPerSlot_1min).toBe(6000); // 60 s / 10 slots
        });

        // Reporting the minute before it as the "1min" figure would label a measurement as something it
        // is not, so the figure goes absent rather than naming the wrong minute.
        it('should drop the 1min figure when the newest minute produced no slot', () => {
            const initialState = createInitialState({ msPerSlot_1h: 400, msPerSlot_1min: 400 });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetPerfSamples, [sample(0), sample(10)]),
            );

            expect(result.msPerSlot_1min).toBeUndefined();
            expect(result.msPerSlot_1h).toBe(6000); // 60 s / 10 slots
        });

        // A stalled cluster serves a zero-slot newest sample on every poll, so a first load has no
        // earlier figure to fall back on. Holding the state here left the card at 0 ms per slot, which
        // never reaches Ready.
        it('should report the hour when the newest minute produced no slot and nothing was measured yet', () => {
            const initialState = createInitialState({ epochInfo: mockEpochInfo({ absoluteSlot: BigInt(440004500) }) });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetPerfSamples, [sample(0), sample(310)]),
            );

            expect(result.msPerSlot_1h).toBe(194); // 60 s / 310 slots
            expect(result.msPerSlot_1min).toBeUndefined();
            expect(result.status).toBe(ClusterStatsStatus.Ready);
        });

        it.each([
            { absoluteSlot: BigInt(1000), status: 'Ready' as const },
            { absoluteSlot: BigInt(0), status: 'Loading' as const },
        ])('should set status to $status when epochInfo.absoluteSlot is $absoluteSlot', ({ absoluteSlot, status }) => {
            const initialState = createInitialState({ epochInfo: mockEpochInfo({ absoluteSlot }) });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetPerfSamples, [sample(10)]),
            );

            expect(result.status).toBe(ClusterStatsStatus[status]);
        });
    });

    describe('SetEpochInfo', () => {
        const epochInfo = mockEpochInfo({ absoluteSlot: BigInt(1000) });

        it('should update epochInfo and set status to Ready when msPerSlot_1h is not zero', () => {
            const initialState = createInitialState({ msPerSlot_1h: 500 });

            const result = dashboardInfoReducer(initialState, action(DashboardInfoActionType.SetEpochInfo, epochInfo));

            expect(result.epochInfo).toEqual(epochInfo);
            expect(result.status).toBe(ClusterStatsStatus.Ready);
        });

        it('should set status to Loading when msPerSlot_1h is zero', () => {
            const initialState = createInitialState({ msPerSlot_1h: 0 });

            const result = dashboardInfoReducer(initialState, action(DashboardInfoActionType.SetEpochInfo, epochInfo));

            expect(result.epochInfo).toEqual(epochInfo);
            expect(result.status).toBe(ClusterStatsStatus.Loading);
        });

        it('should interpolate blockTime when all conditions are met', () => {
            const lastBlockTime: BlockTimeInfo = {
                blockTime: 1000000000,
                slot: BigInt(500),
            };
            const initialState = createInitialState({
                blockTime: 1000000000,
                lastBlockTime,
                msPerSlot_1h: 500, // 500ms per slot
            });

            const result = dashboardInfoReducer(initialState, action(DashboardInfoActionType.SetEpochInfo, epochInfo));

            // blockTime = 1000000000 + (1000 - 500) * 500 = 1000000000 + 250000 = 1000250000
            const expectedBlockTime = 1000000000 + (1000 - 500) * 500;
            expect(result.blockTime).toBe(expectedBlockTime);
        });

        it('should not interpolate when absoluteSlot is less than lastBlockTime.slot', () => {
            const lastBlockTime: BlockTimeInfo = {
                blockTime: 1000000000,
                slot: BigInt(1000),
            };
            const initialState = createInitialState({
                blockTime: 1000000000,
                lastBlockTime,
                msPerSlot_1h: 500,
            });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetEpochInfo, mockEpochInfo({ absoluteSlot: BigInt(500) })),
            );

            expect(result.blockTime).toBe(1000000000); // Preserved, no interpolation
        });

        it('should not interpolate when msPerSlot_1h is zero', () => {
            const lastBlockTime: BlockTimeInfo = {
                blockTime: 1000000000,
                slot: BigInt(500),
            };
            const initialState = createInitialState({
                blockTime: 1000000000,
                lastBlockTime,
                msPerSlot_1h: 0,
            });

            const result = dashboardInfoReducer(initialState, action(DashboardInfoActionType.SetEpochInfo, epochInfo));

            expect(result.blockTime).toBe(1000000000); // Preserved, no interpolation
        });

        it('should not interpolate when lastBlockTime is not set', () => {
            const initialState = createInitialState({
                blockTime: 1000000000,
                lastBlockTime: undefined,
                msPerSlot_1h: 500,
            });

            const result = dashboardInfoReducer(initialState, action(DashboardInfoActionType.SetEpochInfo, epochInfo));

            expect(result.blockTime).toBe(1000000000); // Preserved, no interpolation
        });

        it('should handle blockTime interpolation with exact slot match', () => {
            const lastBlockTime: BlockTimeInfo = {
                blockTime: 1000000000,
                slot: BigInt(500),
            };
            const initialState = createInitialState({
                blockTime: 1000000000,
                lastBlockTime,
                msPerSlot_1h: 500,
            });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetEpochInfo, mockEpochInfo({ absoluteSlot: BigInt(500) })),
            );

            // blockTime = 1000000000 + (500 - 500) * 500 = 1000000000
            expect(result.blockTime).toBe(1000000000);
        });
    });

    describe('SetError', () => {
        it('should set status to Error and preserve all other state properties', () => {
            const initialState = createInitialState({
                blockTime: 1234567890,
                msPerSlot_1h: 500,
                msPerSlot_1min: 600,
                status: ClusterStatsStatus.Ready,
            });

            const result = dashboardInfoReducer(
                initialState,
                action(DashboardInfoActionType.SetError, 'Some error message'),
            );

            expect(result).toEqual({
                ...initialState,
                status: ClusterStatsStatus.Error,
            });
        });
    });

    describe('Reset', () => {
        it('should replace entire state with action data', () => {
            const initialState = createInitialState({
                blockTime: 1234567890,
                lastBlockTime: {
                    blockTime: 1234567890,
                    slot: BigInt(1000),
                },
                msPerSlot_1h: 500,
                msPerSlot_1min: 600,
                status: ClusterStatsStatus.Ready,
            });
            const newState: DashboardInfo = {
                epochInfo: mockEpochInfo({ absoluteSlot: BigInt(2000) }),
                msPerSlot_1h: 700,
                msPerSlot_1min: 800,
                status: ClusterStatsStatus.Loading,
            };

            const result = dashboardInfoReducer(initialState, action(DashboardInfoActionType.Reset, newState));

            expect(result).toEqual(newState);
        });
    });

    describe('default case', () => {
        it('should return state unchanged for unknown action type', () => {
            const initialState = createInitialState();
            const unknownAction = {
                data: {},
                type: 'UnknownAction' as unknown as DashboardInfoActionType,
            } as unknown as DashboardInfoAction;

            const result = dashboardInfoReducer(initialState, unknownAction);

            expect(result).toBe(initialState);
        });
    });
});

function sample(numSlots: number): PerformanceSample {
    return { numSlots: BigInt(numSlots), numTransactions: BigInt(100), samplePeriodSecs: 60 };
}

function action<T extends DashboardInfoActionType>(
    type: T,
    data: Extract<DashboardInfoAction, { type: T }>['data'],
): DashboardInfoAction {
    return { data, type } as DashboardInfoAction;
}
