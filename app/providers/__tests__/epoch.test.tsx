import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EpochSchedule } from '../../utils/epoch-schedule';
import { fetchEpoch, FetchStatus } from '../epoch';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';

const SCHEDULE: EpochSchedule = { firstNormalEpoch: 0n, firstNormalSlot: 0n, slotsPerEpoch: 432000n };
const EPOCH = 10;
const FIRST_SLOT = 4320000n;
const LAST_SLOT = 4751999n;

const getBlocks = vi.fn();
const getBlockTime = vi.fn();
const getRpc = vi.fn((_url: string) => ({
    getBlockTime: (...args: unknown[]) => ({ send: () => getBlockTime(...args) }),
    getBlocks: (...args: unknown[]) => ({ send: () => getBlocks(...args) }),
}));

vi.mock('@entities/cluster', async importOriginal => ({
    ...((await importOriginal()) as Record<string, unknown>),
    getRpc: (...args: [string]) => getRpc(...args),
}));

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

const dispatch = vi.fn();

function lastUpdate() {
    const calls = dispatch.mock.calls;
    return calls[calls.length - 1][0] as {
        data?: { firstBlock: number; firstTimestamp: number | null; lastBlock?: number; lastTimestamp: number | null };
        status: FetchStatus;
    };
}

beforeEach(() => {
    vi.resetAllMocks();
    getRpc.mockReturnValue({
        getBlockTime: (...args: unknown[]) => ({ send: () => getBlockTime(...args) }),
        getBlocks: (...args: unknown[]) => ({ send: () => getBlocks(...args) }),
    });
});

describe('fetchEpoch', () => {
    it('should narrow the epoch boundary slots and timestamps to numbers', async () => {
        getBlocks
            .mockResolvedValueOnce([FIRST_SLOT, FIRST_SLOT + 1n])
            .mockResolvedValueOnce([LAST_SLOT - 1n, LAST_SLOT]);
        getBlockTime.mockResolvedValueOnce(1700000000n).mockResolvedValueOnce(1700100000n);

        await fetchEpoch(dispatch, MOCK_URL, Cluster.MainnetBeta, SCHEDULE, 20n, EPOCH);

        expect(getRpc).toHaveBeenCalledWith(MOCK_URL);
        expect(getBlocks).toHaveBeenNthCalledWith(1, FIRST_SLOT, FIRST_SLOT + 100n);
        expect(getBlocks).toHaveBeenNthCalledWith(2, LAST_SLOT - 100n, LAST_SLOT);
        expect(lastUpdate()).toMatchObject({
            data: {
                firstBlock: Number(FIRST_SLOT),
                firstTimestamp: 1700000000,
                lastBlock: Number(LAST_SLOT),
                lastTimestamp: 1700100000,
            },
            status: FetchStatus.Fetched,
        });
    });

    it('should clamp the trailing getBlocks range at slot 0 for epoch 0', async () => {
        const tinySchedule: EpochSchedule = { firstNormalEpoch: 0n, firstNormalSlot: 0n, slotsPerEpoch: 32n };
        getBlocks.mockResolvedValueOnce([0n]).mockResolvedValueOnce([31n]);
        getBlockTime.mockResolvedValue(1700000000n);

        await fetchEpoch(dispatch, MOCK_URL, Cluster.MainnetBeta, tinySchedule, 20n, 0);

        expect(getBlocks).toHaveBeenNthCalledWith(2, 0n, 31n);
        expect(lastUpdate().status).toBe(FetchStatus.Fetched);
    });

    it('should preserve a null timestamp for a block with no recorded time', async () => {
        getBlocks.mockResolvedValueOnce([FIRST_SLOT]).mockResolvedValueOnce([LAST_SLOT]);
        getBlockTime.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

        await fetchEpoch(dispatch, MOCK_URL, Cluster.MainnetBeta, SCHEDULE, 20n, EPOCH);

        expect(lastUpdate().data).toMatchObject({ firstTimestamp: null, lastTimestamp: null });
    });

    it('should request a timestamp for a last block at slot 0 rather than skipping it', async () => {
        const tinySchedule: EpochSchedule = { firstNormalEpoch: 0n, firstNormalSlot: 0n, slotsPerEpoch: 32n };
        getBlocks.mockResolvedValueOnce([0n]).mockResolvedValueOnce([0n]);
        getBlockTime.mockResolvedValue(1700000000n);

        await fetchEpoch(dispatch, MOCK_URL, Cluster.MainnetBeta, tinySchedule, 20n, 0);

        expect(getBlockTime).toHaveBeenCalledTimes(2);
        expect(lastUpdate().data).toMatchObject({ lastBlock: 0, lastTimestamp: 1700000000 });
    });

    it('should dispatch FetchFailed when no block is found at the start of the epoch', async () => {
        getBlocks.mockResolvedValue([]);

        await fetchEpoch(dispatch, MOCK_URL, Cluster.MainnetBeta, SCHEDULE, 20n, EPOCH);

        expect(lastUpdate()).toMatchObject({ data: undefined, status: FetchStatus.FetchFailed });
    });
});
