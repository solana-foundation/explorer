import { gen } from '@__fixtures__/gen';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lastDispatch, rpcStub } from '@/app/__tests__/mock-rpc';

import { fetchBlock, FetchStatus } from '../block';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';
const SLOT = 100;
const PARENT_SLOT = 99;

const getBlocks = vi.fn();
const getSlotLeaders = vi.fn();
const getRpc = vi.fn((_url: string) => rpcStub({ getBlocks, getSlotLeaders }));

vi.mock('@entities/cluster', async importOriginal => ({
    ...((await importOriginal()) as Record<string, unknown>),
    getRpc: (...args: [string]) => getRpc(...args),
}));

const fetchBlockBySlot = vi.fn();
vi.mock('@entities/block-data', () => ({
    fetchBlock: (...args: unknown[]) => fetchBlockBySlot(...args),
}));

const LEADERS = [gen.address(1), gen.address(2), gen.address(3)];

const dispatch = vi.fn<Parameters<typeof fetchBlock>[0]>();

beforeEach(() => {
    vi.resetAllMocks();
    fetchBlockBySlot.mockResolvedValue({ parentSlot: BigInt(PARENT_SLOT) });
});

describe('fetchBlock', () => {
    it('should keep the child slot and leaders in their kit types', async () => {
        getBlocks.mockResolvedValue([101n, 102n]);
        getSlotLeaders.mockResolvedValue(LEADERS);

        await fetchBlock(dispatch, MOCK_URL, Cluster.MainnetBeta, SLOT);

        expect(getRpc).toHaveBeenCalledWith(MOCK_URL);
        expect(getBlocks).toHaveBeenCalledWith(101n, 200n);
        // parentSlot..childSlot inclusive
        expect(getSlotLeaders).toHaveBeenCalledWith(99n, 3);

        const { data, status } = lastDispatch(dispatch);
        expect(status).toBe(FetchStatus.Fetched);
        expect(data?.childSlot).toBe(101n);
        expect(data?.parentLeader).toBe(LEADERS[0]);
        expect(data?.blockLeader).toBe(LEADERS[1]);
        expect(data?.childLeader).toBe(LEADERS[2]);
    });

    it('should leave the child slot and child leader undefined when no later block exists', async () => {
        getBlocks.mockResolvedValue([]);
        getSlotLeaders.mockResolvedValue(LEADERS);

        await fetchBlock(dispatch, MOCK_URL, Cluster.MainnetBeta, SLOT);

        expect(getSlotLeaders).toHaveBeenCalledWith(99n, 2);
        const { data } = lastDispatch(dispatch);
        expect(data?.childSlot).toBeUndefined();
        expect(data?.childLeader).toBeUndefined();
        expect(data?.blockLeader).toBe(LEADERS[1]);
    });

    it('should still report the block when the leader lookup fails', async () => {
        getBlocks.mockResolvedValue([101n]);
        getSlotLeaders.mockRejectedValue(new Error('leader schedule unavailable'));

        await fetchBlock(dispatch, MOCK_URL, Cluster.MainnetBeta, SLOT);

        const { data, status } = lastDispatch(dispatch);
        expect(status).toBe(FetchStatus.Fetched);
        expect(data?.blockLeader).toBeUndefined();
    });

    it('should report an empty block when the slot was skipped', async () => {
        fetchBlockBySlot.mockResolvedValue(null);

        await fetchBlock(dispatch, MOCK_URL, Cluster.MainnetBeta, SLOT);

        expect(getBlocks).not.toHaveBeenCalled();
        expect(lastDispatch(dispatch)).toMatchObject({ data: {}, status: FetchStatus.Fetched });
    });

    it('should dispatch FetchFailed when the block fetch throws', async () => {
        fetchBlockBySlot.mockRejectedValue(new Error('rpc boom'));

        await fetchBlock(dispatch, MOCK_URL, Cluster.MainnetBeta, SLOT);

        expect(lastDispatch(dispatch)).toMatchObject({ data: undefined, status: FetchStatus.FetchFailed });
    });
});
