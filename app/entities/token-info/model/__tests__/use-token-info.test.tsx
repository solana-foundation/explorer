import { renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTokenInfo } from '../use-token-info';

const mockRequestTokenInfo = vi.fn();
const ADDR = 'So11111111111111111111111111111111';

vi.mock('../token-info-batch-provider', () => ({
    useTokenInfoBatch: () => mockRequestTokenInfo,
}));

vi.mock('swr', () => ({
    default: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@utils/token-info', () => ({
    getTokenInfoSwrKey: (address: string, cluster: Cluster, genesisHash?: string) => [
        'get-token-info',
        address,
        cluster,
        genesisHash,
    ],
}));

describe('useTokenInfo', () => {
    beforeEach(() => {
        mockRequestTokenInfo.mockClear();
        vi.mocked(useSWR).mockImplementation(() => ({ data: undefined } as ReturnType<typeof useSWR>));
    });

    it.each([
        ['false', false, ADDR],
        ['undefined', undefined, ADDR],
        ['true with empty pubkey', true, ''],
    ])('does not request token info when fetchTokenLabelInfo is %s', async (_label, fetch, pubkey) => {
        renderHook(() => useTokenInfo(fetch, pubkey, Cluster.MainnetBeta));
        await waitFor(() => expect(mockRequestTokenInfo).not.toHaveBeenCalled());
    });

    it('requests token info with correct args including genesisHash', async () => {
        renderHook(() => useTokenInfo(true, ADDR, Cluster.MainnetBeta, 'abc123'));

        await waitFor(() => {
            expect(mockRequestTokenInfo).toHaveBeenCalledWith(ADDR, Cluster.MainnetBeta, 'abc123');
        });
    });

    it('passes SWR key when enabled, null when disabled', () => {
        renderHook(() => useTokenInfo(true, ADDR, Cluster.MainnetBeta));
        expect(useSWR).toHaveBeenCalledWith(['get-token-info', ADDR, Cluster.MainnetBeta, undefined], null);

        vi.mocked(useSWR).mockClear();

        renderHook(() => useTokenInfo(false, ADDR, Cluster.MainnetBeta));
        expect(useSWR).toHaveBeenCalledWith(null, null);
    });

    it('returns token data from SWR', () => {
        const mockToken = { address: ADDR, name: 'Wrapped SOL', symbol: 'SOL' };
        vi.mocked(useSWR).mockReturnValue({ data: mockToken } as ReturnType<typeof useSWR>);

        const { result } = renderHook(() => useTokenInfo(true, ADDR, Cluster.MainnetBeta));
        expect(result.current).toEqual(mockToken);
    });

    it('re-requests when pubkey or cluster changes', async () => {
        const { rerender } = renderHook(({ pubkey, cluster }) => useTokenInfo(true, pubkey, cluster), {
            initialProps: { cluster: Cluster.MainnetBeta, pubkey: 'address1' },
        });

        await waitFor(() => {
            expect(mockRequestTokenInfo).toHaveBeenCalledWith('address1', Cluster.MainnetBeta, undefined);
        });

        rerender({ cluster: Cluster.MainnetBeta, pubkey: 'address2' });
        await waitFor(() => expect(mockRequestTokenInfo).toHaveBeenCalledTimes(2));

        rerender({ cluster: Cluster.Devnet, pubkey: 'address2' });
        await waitFor(() => expect(mockRequestTokenInfo).toHaveBeenCalledTimes(3));
        expect(mockRequestTokenInfo).toHaveBeenLastCalledWith('address2', Cluster.Devnet, undefined);
    });
});
