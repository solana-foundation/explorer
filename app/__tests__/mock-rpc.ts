import { vi } from 'vitest';

import { GENESIS_HASHES } from '@/app/entities/chain-id';
import type { ClusterInfo } from '@/app/providers/cluster';
import type { EpochSchedule } from '@/app/utils/epoch-schedule';

import { gen } from '@/app/__fixtures__/gen';

interface EpochInfo {
    absoluteSlot: bigint;
    blockHeight: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
}

export const mockEpochInfo = (overrides?: Partial<EpochInfo>): EpochInfo => ({
    absoluteSlot: gen.slot(),
    blockHeight: gen.blockHeight(),
    epoch: gen.epoch(),
    slotIndex: gen.bigint(432_000n),
    slotsInEpoch: 432_000n,
    ...overrides,
});

export const mockEpochSchedule = (overrides?: Partial<EpochSchedule>): EpochSchedule => ({
    firstNormalEpoch: gen.epoch(),
    firstNormalSlot: gen.slot(),
    slotsPerEpoch: 432_000n,
    ...overrides,
});

export const mockGenesisHash = (hash?: string): string => hash ?? GENESIS_HASHES.MAINNET;

export const mockFirstAvailableBlock = (block?: bigint): bigint => block ?? gen.slot();

/** Creates a mock RPC object matching the shape returned by createSolanaRpc() */
export const mockSolanaRpc = (overrides?: Partial<ClusterInfo>) => ({
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
