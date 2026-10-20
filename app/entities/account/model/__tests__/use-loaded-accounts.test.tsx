import { DEFAULT_RPC_URL, gen } from '@__fixtures__/gen';
import { renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import React from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { ERROR_RETRY_COUNT, useLoadedAccounts } from '../use-loaded-accounts';

const DEVNET_URL = 'https://api.devnet.solana.com';
const CUSTOM_URL = 'http://localhost:8899';
const ADDRESS_1 = gen.address(1);
const ADDRESS_2 = gen.address(2);

const mockGetMultipleAccounts = vi.fn();
const mockCluster = vi.hoisted(() => ({ current: {} as { cluster: Cluster; url: string } }));

vi.mock('@providers/cluster', () => ({ useCluster: () => mockCluster.current }));

vi.mock('@entities/cluster/@x/account', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster/@x/account')>('@entities/cluster/@x/account');
    return {
        ...actual,
        getRpc: vi.fn(() => ({
            getMultipleAccounts: (...args: unknown[]) => ({
                send: async () => ({ value: await mockGetMultipleAccounts(...args) }),
            }),
        })),
    };
});

describe('useLoadedAccounts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCluster.current = { cluster: Cluster.MainnetBeta, url: DEFAULT_RPC_URL };
        mockGetMultipleAccounts.mockImplementation(async addresses => sizedAccounts(addresses));
    });

    it('should send no request for an empty list', () => {
        renderHook(() => useLoadedAccounts([]), { wrapper });

        expect(mockGetMultipleAccounts).not.toHaveBeenCalled();
    });

    it('should count the accounts and total their sizes', async () => {
        const { result } = renderHook(() => useLoadedAccounts([ADDRESS_1, ADDRESS_2]), { wrapper });

        await waitFor(() => expect(result.current).toEqual({ accountCount: 2, dataSize: 201 }));
    });

    it('should read a new list rather than return the total of the first list', async () => {
        const { rerender, result } = renderHook(({ addresses }) => useLoadedAccounts(addresses), {
            initialProps: { addresses: [ADDRESS_1] },
            wrapper,
        });
        await waitFor(() => expect(result.current).toEqual({ accountCount: 1, dataSize: 100 }));

        rerender({ addresses: [ADDRESS_1, ADDRESS_2] });

        await waitFor(() => expect(result.current).toEqual({ accountCount: 2, dataSize: 201 }));
    });

    it('should read the sizes again when the cluster changes', async () => {
        const { rerender } = renderHook(() => useLoadedAccounts([ADDRESS_1]), { wrapper });
        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1));

        mockCluster.current = { cluster: Cluster.Devnet, url: DEVNET_URL };
        rerender();

        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(2));
    });

    it('should log a failed request to the console only', async () => {
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderHook(() => useLoadedAccounts([ADDRESS_1]), { wrapper });

        await waitFor(() =>
            expect(Logger.error).toHaveBeenCalledWith(new Error('rpc unavailable'), { url: DEFAULT_RPC_URL }),
        );
    });

    it('should not report a failed request on a custom cluster', async () => {
        mockCluster.current = { cluster: Cluster.Custom, url: CUSTOM_URL };
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderHook(() => useLoadedAccounts([ADDRESS_1]), { wrapper });
        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalled());
        await settleRetries();

        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should stop asking a failing node after the capped retries', async () => {
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderHook(() => useLoadedAccounts([ADDRESS_1]), { wrapper });
        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1));
        await settleRetries();

        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1);
    });

    it('should report no total until the sizes arrive', () => {
        mockGetMultipleAccounts.mockReturnValue(new Promise(() => undefined));

        const { result } = renderHook(() => useLoadedAccounts([ADDRESS_1]), { wrapper });

        expect(result.current).toBeUndefined();
    });
});

function sizedAccounts(addresses: readonly string[]) {
    return addresses.map((_, index) => ({ data: ['', 'base64'], executable: false, space: BigInt(100 + index) }));
}

function wrapper({ children }: { children: React.ReactNode }) {
    return <SWRConfig value={{ errorRetryInterval: 1, provider: () => new Map() }}>{children}</SWRConfig>;
}

function settleRetries() {
    return new Promise(resolve => setTimeout(resolve, 100));
}
