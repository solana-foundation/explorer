import { Connection, PublicKey } from '@solana/web3.js';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRawAccountData } from '../use-raw-account-data';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';
const MOCK_ADDRESS = PublicKey.default.toBase58();

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ url: MOCK_URL }),
}));

vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');
    return {
        ...actual,
        Connection: vi.fn().mockImplementation(() => ({
            getAccountInfo: vi.fn(),
        })),
    };
});

function wrapper({ children }: { children: React.ReactNode }) {
    return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>;
}

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

        vi.mocked(Connection).mockImplementation(
            () => ({ getAccountInfo: vi.fn().mockResolvedValue({ data: mockData }) }) as unknown as Connection,
        );

        const { result } = renderHook(() => useRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => {
            result.current.mutate();
        });

        await waitFor(() => {
            expect(result.current.data).toEqual(new Uint8Array(mockData));
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should refetch data when mutate is called again', async () => {
        const mockData1 = new Uint8Array([4, 5, 6]);
        const mockData2 = new Uint8Array([7, 8, 9]);
        const mockGetAccountInfo = vi
            .fn()
            .mockResolvedValueOnce({ data: mockData1 })
            .mockResolvedValueOnce({ data: mockData2 });

        vi.mocked(Connection).mockImplementation(
            () => ({ getAccountInfo: mockGetAccountInfo }) as unknown as Connection,
        );

        const { result } = renderHook(() => useRawAccountData(MOCK_ADDRESS), { wrapper });

        act(() => {
            result.current.mutate();
        });

        await waitFor(() => {
            expect(result.current.data).toEqual(new Uint8Array(mockData1));
        });

        // Call mutate again — should revalidate with fresh data
        act(() => {
            result.current.mutate();
        });

        await waitFor(() => {
            expect(result.current.data).toEqual(new Uint8Array(mockData2));
        });
    });
});
