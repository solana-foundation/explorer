import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FAST_RETRY, settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { toBase64 } from '@/app/shared/lib/bytes';

import { useLazyRawAccountData, useRawAccountData } from '../use-raw-account-data';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';
const MOCK_ADDRESS = PublicKey.default.toBase58();

const mockGetAccountInfo = vi.fn();

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ url: MOCK_URL }),
}));

vi.mock('@entities/cluster/@x/account', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster/@x/account')>('@entities/cluster/@x/account');
    return {
        ...actual,
        getRpc: vi.fn(() => ({
            getAccountInfo: (...args: unknown[]) => ({
                send: async () => ({ value: await mockGetAccountInfo(...args) }),
            }),
        })),
    };
});

function accountInfoValue(data: Uint8Array) {
    return { data: [toBase64(data), 'base64'] };
}

const wrapper = swrWrapper(FAST_RETRY);

describe('useRawAccountData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return undefined data initially', () => {
        const { result } = renderHook(() => useRawAccountData(MOCK_ADDRESS), { wrapper });

        expect(result.current.data).toBeUndefined();
    });

    it('should not be loading initially', () => {
        const { result } = renderHook(() => useRawAccountData(MOCK_ADDRESS), { wrapper });

        expect(result.current.isLoading).toBe(false);
    });

    it('should fetch raw data and return it when mutate is called', async () => {
        const mockData = new Uint8Array([4, 5, 6]);
        mockGetAccountInfo.mockResolvedValue(accountInfoValue(mockData));

        const { result } = renderHook(() => useRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => {
            result.current.mutate();
        });

        await waitForHook(() => {
            expect(result.current.data).toEqual(mockData);
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should refetch data when mutate is called again', async () => {
        const mockData1 = new Uint8Array([4, 5, 6]);
        const mockData2 = new Uint8Array([7, 8, 9]);
        mockGetAccountInfo
            .mockResolvedValueOnce(accountInfoValue(mockData1))
            .mockResolvedValueOnce(accountInfoValue(mockData2));

        const { result } = renderHook(() => useRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => {
            result.current.mutate();
        });

        await waitForHook(() => {
            expect(result.current.data).toEqual(mockData1);
        });

        // Call mutate again — should revalidate with fresh data
        act(() => {
            result.current.mutate();
        });

        await waitForHook(() => {
            expect(result.current.data).toEqual(mockData2);
        });
    });

    it('should stop retrying a failing read after three retries', async () => {
        mockGetAccountInfo.mockRejectedValue(new Error('RPC unavailable'));

        const { result } = renderHook(() => useRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => {
            result.current.mutate();
        });
        await waitForHook(() => expect(mockGetAccountInfo).toHaveBeenCalledTimes(4));
        await settleRetries();

        expect(mockGetAccountInfo).toHaveBeenCalledTimes(4);
    });
});

describe('useLazyRawAccountData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should send one read when load is called again during the read', async () => {
        const mockData = new Uint8Array([4, 5, 6]);
        let resolveRead!: (value: ReturnType<typeof accountInfoValue>) => void;
        mockGetAccountInfo.mockReturnValue(new Promise(resolve => (resolveRead = resolve)));

        const { result } = renderHook(() => useLazyRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => result.current.load());
        await waitForHook(() => expect(result.current.loading).toBe(true));
        act(() => result.current.load());
        act(() => resolveRead(accountInfoValue(mockData)));

        await waitForHook(() => expect(result.current.data).toEqual(mockData));
        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });

    it('should not send a read when load is called after the data loaded', async () => {
        const mockData = new Uint8Array([4, 5, 6]);
        mockGetAccountInfo.mockResolvedValue(accountInfoValue(mockData));

        const { result } = renderHook(() => useLazyRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => result.current.load());
        await waitForHook(() => expect(result.current.data).toEqual(mockData));
        await act(async () => result.current.load());

        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });

    it('should send a new read when load is called after a failed read', async () => {
        mockGetAccountInfo.mockRejectedValue(new Error('RPC unavailable'));

        const { result } = renderHook(() => useLazyRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => result.current.load());
        await waitForHook(() => expect(mockGetAccountInfo).toHaveBeenCalledTimes(4));
        await waitForHook(() => expect(result.current.loading).toBe(false));
        act(() => result.current.load());

        await waitForHook(() => expect(mockGetAccountInfo).toHaveBeenCalledTimes(5));
    });
});
