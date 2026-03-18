import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import useSWRImmutable from 'swr/immutable';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRawAccountData } from '../use-raw-account-data';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';
const MOCK_PUBKEY = new PublicKey('11111111111111111111111111111111');

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ url: MOCK_URL }),
}));

vi.mock('swr/immutable', () => ({
    default: vi.fn(() => ({ data: undefined })),
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

describe('useRawAccountData', () => {
    beforeEach(() => {
        vi.mocked(useSWRImmutable).mockImplementation(
            () => ({ data: undefined } as ReturnType<typeof useSWRImmutable>)
        );
    });

    it('should pass null SWR key when not yet enabled', () => {
        renderHook(() => useRawAccountData(MOCK_PUBKEY));

        expect(useSWRImmutable).toHaveBeenCalledWith(null, expect.any(Function));
    });

    it('should return null data initially', () => {
        const { result } = renderHook(() => useRawAccountData(MOCK_PUBKEY));

        expect(result.current[0]).toBeNull();
    });

    it('should return an enable callback as the second element', () => {
        const { result } = renderHook(() => useRawAccountData(MOCK_PUBKEY));

        expect(typeof result.current[1]).toBe('function');
    });

    it('should pass the correct SWR key after enabling', () => {
        const { result } = renderHook(() => useRawAccountData(MOCK_PUBKEY));

        act(() => {
            result.current[1]();
        });

        expect(useSWRImmutable).toHaveBeenCalledWith(
            ['rawAccountData', MOCK_URL, MOCK_PUBKEY.toBase58()],
            expect.any(Function)
        );
    });

    it('should return data from SWR when available', () => {
        const mockData = new Uint8Array([1, 2, 3]);
        vi.mocked(useSWRImmutable).mockReturnValue({ data: mockData } as ReturnType<typeof useSWRImmutable>);

        const { result } = renderHook(() => useRawAccountData(MOCK_PUBKEY));

        expect(result.current[0]).toBe(mockData);
    });

    describe('fetchRawAccountData', () => {
        it('should pass the fetcher to useSWRImmutable', () => {
            renderHook(() => useRawAccountData(MOCK_PUBKEY));

            const fetcherArg = vi.mocked(useSWRImmutable).mock.calls[0][1];
            expect(fetcherArg).toBeTypeOf('function');
        });
    });
});
