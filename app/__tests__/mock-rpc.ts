import { vi } from 'vitest';

import { GENESIS_HASHES } from '@/app/entities/chain-id';
import type { ClusterInfo } from '@/app/providers/cluster';
import type { EpochSchedule } from '@/app/utils/epoch-schedule';

const randomBigint = (max: bigint) => BigInt(Math.floor(Math.random() * Number(max)));

interface EpochInfo {
    absoluteSlot: bigint;
    blockHeight: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
}

export const mockEpochInfo = (overrides?: Partial<EpochInfo>): EpochInfo => {
    const slotsInEpoch = 432_000n;
    const absoluteSlot = randomBigint(300_000_000n);
    return {
        absoluteSlot,
        blockHeight: randomBigint(250_000_000n),
        epoch: absoluteSlot / slotsInEpoch,
        slotIndex: absoluteSlot % slotsInEpoch,
        slotsInEpoch,
        ...overrides,
    };
};

export const mockEpochSchedule = (overrides?: Partial<EpochSchedule>): EpochSchedule => ({
    firstNormalEpoch: randomBigint(1_000n),
    firstNormalSlot: randomBigint(300_000_000n),
    slotsPerEpoch: 432_000n,
    ...overrides,
});

export const mockGenesisHash = (hash?: string): string => hash ?? GENESIS_HASHES.MAINNET;

export const mockFirstAvailableBlock = (block?: bigint): bigint => block ?? randomBigint(300_000_000n);

/** Creates a mock RPC object matching the shape returned by createSolanaRpc() */
export const mockSolanaRpc = (overrides?: Partial<ClusterInfo> & { genesisHash?: string }) => ({
    getEpochInfo: () => ({
        send: vi.fn().mockResolvedValue(mockEpochInfo(overrides?.epochInfo)),
    }),
    getEpochSchedule: () => ({
        send: vi.fn().mockResolvedValue({
            ...mockEpochSchedule(overrides?.epochSchedule),
            leaderScheduleSlotOffset: 0n,
            warmup: false,
        }),
    }),
    getFirstAvailableBlock: () => ({
        send: vi.fn().mockResolvedValue(mockFirstAvailableBlock(overrides?.firstAvailableBlock)),
    }),
    getGenesisHash: () => ({
        send: vi.fn().mockResolvedValue(mockGenesisHash(overrides?.genesisHash)),
    }),
});
