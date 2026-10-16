// Every spec file loads this module through the setup file. Importing `gen` or `@solana/kit` here
// would load kit and web3.js into every spec file.
import { type Mock, vi } from 'vitest';

import { GENESIS_HASHES } from '@/app/entities/chain-id';
import type { Dispatch, Update } from '@/app/providers/cache';
import type { ClusterInfo } from '@/app/providers/cluster';

interface EpochInfo {
    absoluteSlot: bigint;
    blockHeight: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
}

export const mockEpochInfo = (overrides?: Partial<EpochInfo>): EpochInfo => {
    const slotsInEpoch = 432_000n;
    const absoluteSlot = 250_000_000n;
    return {
        absoluteSlot,
        blockHeight: 230_000_000n,
        epoch: absoluteSlot / slotsInEpoch,
        slotIndex: absoluteSlot % slotsInEpoch,
        slotsInEpoch,
        ...overrides,
    };
};

/** Creates a mock RPC object matching the shape returned by createSolanaRpc() */
export const mockSolanaRpc = (
    overrides?: Partial<ClusterInfo> & { firstAvailableBlock?: bigint; genesisHash?: string },
) => ({
    // Before the Alpenglow transition, no genesis certificate exists, so the RPC returns null.
    getAgGenesisCert: () => ({
        send: vi.fn().mockResolvedValue(null),
    }),
    getEpochInfo: () => ({
        send: vi.fn().mockResolvedValue(mockEpochInfo(overrides?.epochInfo)),
    }),
    getEpochSchedule: () => ({
        send: vi.fn().mockResolvedValue({
            firstNormalEpoch: 0n,
            firstNormalSlot: 0n,
            slotsPerEpoch: 432_000n,
            ...overrides?.epochSchedule,
            leaderScheduleSlotOffset: 0n,
            warmup: false,
        }),
    }),
    getFirstAvailableBlock: () => ({
        send: vi.fn().mockResolvedValue(overrides?.firstAvailableBlock ?? 0n),
    }),
    getGenesisHash: () => ({
        send: vi.fn().mockResolvedValue(overrides?.genesisHash ?? GENESIS_HASHES.MAINNET),
    }),
    getMultipleAccounts: (addresses: readonly unknown[]) => ({
        send: vi.fn().mockResolvedValue({
            context: { slot: 0n },
            value: addresses.map(() => null),
        }),
    }),
});

/** Wraps each mock as a kit RPC method, so `rpc.method(...args).send()` returns `method(...args)`. */
export function rpcStub(methods: Record<string, Mock>) {
    return Object.fromEntries(
        Object.entries(methods).map(([name, method]) => [
            name,
            (...args: unknown[]) => ({ send: () => method(...args) }),
        ]),
    );
}

/** Returns the update a mocked cache dispatch received last. */
export function lastDispatch<T>(dispatch: Mock<Dispatch<T>>): Update<T> {
    const action = dispatch.mock.lastCall?.[0];
    if (!action || !('status' in action)) throw new Error('the last dispatch was not an update');
    return action;
}
