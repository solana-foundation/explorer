import { DEFAULT_RPC_URL, gen } from '@__fixtures__/gen';
import { renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import React from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { ERROR_RETRY_COUNT, useAccountSizes } from '../use-account-sizes';

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

describe('useAccountSizes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCluster.current = { cluster: Cluster.MainnetBeta, url: DEFAULT_RPC_URL };
        mockGetMultipleAccounts.mockImplementation(async addresses => sizedAccounts(addresses));
    });

    it('should send no request for an empty list', () => {
        renderHook(() => useAccountSizes([]), { wrapper });

        expect(mockGetMultipleAccounts).not.toHaveBeenCalled();
    });

    it('should map each address to the size the node reports', async () => {
        const { result } = renderHook(() => useAccountSizes([ADDRESS_1, ADDRESS_2]), { wrapper });

        await waitFor(() => expect(result.current.get(ADDRESS_1)).toBe(100));
        expect(result.current.get(ADDRESS_2)).toBe(101);
    });

    it('should read a new list rather than return the sizes of the first list', async () => {
        const { rerender, result } = renderHook(({ addresses }) => useAccountSizes(addresses), {
            initialProps: { addresses: [ADDRESS_1] },
            wrapper,
        });
        await waitFor(() => expect(result.current.size).toBe(1));

        rerender({ addresses: [ADDRESS_2] });

        await waitFor(() => expect(result.current.get(ADDRESS_2)).toBe(100));
        expect(result.current.has(ADDRESS_1)).toBe(false);
    });

    it('should read the sizes again when the cluster changes', async () => {
        const { rerender } = renderHook(() => useAccountSizes([ADDRESS_1]), { wrapper });
        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1));

        mockCluster.current = { cluster: Cluster.Devnet, url: DEVNET_URL };
        rerender();

        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(2));
    });

    it('should log a failed request to the console only', async () => {
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderHook(() => useAccountSizes([ADDRESS_1]), { wrapper });

        await waitFor(() =>
            expect(Logger.error).toHaveBeenCalledWith(new Error('rpc unavailable'), { url: DEFAULT_RPC_URL }),
        );
    });

    it('should not report a failed request on a custom cluster', async () => {
        mockCluster.current = { cluster: Cluster.Custom, url: CUSTOM_URL };
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderHook(() => useAccountSizes([ADDRESS_1]), { wrapper });
        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalled());
        await settleRetries();

        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should stop asking a failing node after the capped retries', async () => {
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderHook(() => useAccountSizes([ADDRESS_1]), { wrapper });
        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1));
        await settleRetries();

        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(ERROR_RETRY_COUNT + 1);
    });

    it('should hold one empty map until the sizes arrive', () => {
        mockGetMultipleAccounts.mockReturnValue(new Promise(() => undefined));

        const { rerender, result } = renderHook(() => useAccountSizes([ADDRESS_1]), { wrapper });
        const first = result.current;
        rerender();

        expect(result.current).toBe(first);
        expect(first.size).toBe(0);
    });
});

function sizedAccounts(addresses: readonly string[]) {
    return addresses.map((_, index) => ({ data: ['', 'base64'], space: BigInt(100 + index) }));
}

function wrapper({ children }: { children: React.ReactNode }) {
    return <SWRConfig value={{ errorRetryInterval: 1, provider: () => new Map() }}>{children}</SWRConfig>;
}

function settleRetries() {
    return new Promise(resolve => setTimeout(resolve, 100));
}
