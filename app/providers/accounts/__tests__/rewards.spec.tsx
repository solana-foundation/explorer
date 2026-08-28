import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { Cluster, clusterSelection, clusterUrl } from '@utils/cluster';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useClusterMock, getEpochInfo, getInflationReward, getRpc } = vi.hoisted(() => {
    const getEpochInfo = vi.fn();
    const getInflationReward = vi.fn();
    return {
        getEpochInfo,
        getInflationReward,
        getRpc: vi.fn((_url: string) => ({
            getEpochInfo: (...args: unknown[]) => ({ send: () => getEpochInfo(...args) }),
            getInflationReward: (...args: unknown[]) => ({ send: () => getInflationReward(...args) }),
        })),
        useClusterMock: vi.fn(),
    };
});

vi.mock('@providers/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/cluster')>();
    return { ...actual, useCluster: useClusterMock };
});

vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return { ...actual, getRpc };
});

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { RewardsProvider, useFetchRewards, useRewards } from '../rewards';

const ADDRESS = PublicKey.default.toBase58();
const CURRENT_EPOCH = 10n;

/** The shape kit returns for a single inflation reward: every integral field is a bigint. */
function makeInflationReward(epoch: bigint) {
    return {
        amount: 12345n,
        commission: 5,
        effectiveSlot: epoch * 100n,
        epoch,
        postBalance: 999999n,
    };
}

function TestComponent() {
    const entry = useRewards(ADDRESS);
    const fetchRewards = useFetchRewards();
    // `useFetchRewards` closes over the cache state, so its identity changes on every dispatch;
    // firing it unguarded would re-enter on its own result.
    const fetched = React.useRef(false);
    React.useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;
        fetchRewards(new PublicKey(ADDRESS));
    }, [fetchRewards]);

    if (!entry) return null;
    return (
        <div>
            <span data-testid="fetch-status">{entry.status}</span>
            <span data-testid="reward-count">{entry.data?.rewards?.length ?? 0}</span>
            <span data-testid="highest-epoch">{String(entry.data?.highestFetchedEpoch)}</span>
            <span data-testid="reward-json">{JSON.stringify(entry.data?.rewards?.[0] ?? null)}</span>
        </div>
    );
}

function renderRewards() {
    render(
        <RewardsProvider>
            <TestComponent />
        </RewardsProvider>,
    );
    return waitFor(() => expect(screen.getByTestId('fetch-status').textContent).toBe(String(FetchStatus.Fetched)));
}

describe('RewardsProvider', () => {
    beforeEach(() => {
        const selection = clusterSelection(Cluster.Devnet);
        useClusterMock.mockReturnValue({ ...selection, selection, url: clusterUrl(selection) });
        getEpochInfo.mockResolvedValue({ epoch: CURRENT_EPOCH });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('should expose rewards as numbers so they survive JSON serialization', async () => {
        getInflationReward.mockImplementation((_addresses, config) => [makeInflationReward(config.epoch)]);

        await renderRewards();

        // A bigint anywhere in the payload would have thrown inside JSON.stringify.
        expect(JSON.parse(screen.getByTestId('reward-json').textContent ?? 'null')).toEqual({
            amount: 12345,
            commission: 5,
            effectiveSlot: 900,
            epoch: 9,
            postBalance: 999999,
        });
        expect(screen.getByTestId('highest-epoch').textContent).toBe('9');
    });

    it('should key rewards by epoch, one entry per epoch back to genesis', async () => {
        getInflationReward.mockImplementation((_addresses, config) => [makeInflationReward(config.epoch)]);

        await renderRewards();

        // Epoch 9 down to 0 — the page size is 15, but there are no negative epochs to request.
        expect(screen.getByTestId('reward-count').textContent).toBe('10');
    });

    it('should drop a single failed epoch without failing the whole page', async () => {
        getInflationReward.mockImplementation((_addresses, config) => {
            if (config.epoch === 5n) throw new Error('node refused this epoch');
            return [makeInflationReward(config.epoch)];
        });

        await renderRewards();

        expect(screen.getByTestId('reward-count').textContent).toBe('9');
    });
});
