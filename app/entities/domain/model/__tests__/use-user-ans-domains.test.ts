import { useCluster } from '@providers/cluster';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserANSDomains } from '../use-user-ans-domains';

vi.mock('@providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('swr', () => ({ default: vi.fn() }));

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const USER_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const mockDomains = [
    { address: {} as never, name: 'alice.abc' },
    { address: {} as never, name: 'charlie.abc' },
];

const swrResponse = (overrides: { data?: unknown; isLoading?: boolean; error?: unknown } = {}) => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
    ...overrides,
});

describe('useUserANSDomains', () => {
    beforeEach(() => {
        vi.mocked(useCluster).mockReturnValue({
            cluster: Cluster.MainnetBeta,
            url: MAINNET_URL,
        } as ReturnType<typeof useCluster>);
        vi.mocked(useSWR).mockReturnValue(swrResponse());
    });

    it('returns SWR response with no request when cluster is not Mainnet or Custom', () => {
        vi.mocked(useCluster).mockReturnValue({
            cluster: Cluster.Devnet,
            url: 'https://api.devnet.solana.com',
        } as ReturnType<typeof useCluster>);

        const { result } = renderHook(() => useUserANSDomains(USER_ADDRESS));

        expect(useSWR).toHaveBeenCalledWith(null, null, expect.any(Object));
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('returns SWR response with no request when userAddress is empty', () => {
        const { result } = renderHook(() => useUserANSDomains(''));

        expect(useSWR).toHaveBeenCalledWith(null, null, expect.any(Object));
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('requests with correct SWR key on Mainnet', () => {
        renderHook(() => useUserANSDomains(USER_ADDRESS));

        expect(useSWR).toHaveBeenCalledWith(
            ['user-ans-domains', MAINNET_URL, USER_ADDRESS],
            expect.any(Function),
            expect.objectContaining({ revalidateOnFocus: false })
        );
    });

    it('requests with correct SWR key on Custom cluster', () => {
        const customUrl = 'https://custom.rpc.com';
        vi.mocked(useCluster).mockReturnValue({
            cluster: Cluster.Custom,
            url: customUrl,
        } as ReturnType<typeof useCluster>);

        renderHook(() => useUserANSDomains(USER_ADDRESS));

        expect(useSWR).toHaveBeenCalledWith(
            ['user-ans-domains', customUrl, USER_ADDRESS],
            expect.any(Function),
            expect.any(Object)
        );
    });

    it('returns isLoading true when loading', () => {
        vi.mocked(useSWR).mockReturnValue(swrResponse({ isLoading: true }));

        const { result } = renderHook(() => useUserANSDomains(USER_ADDRESS));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });

    it('returns data when loaded', () => {
        vi.mocked(useSWR).mockReturnValue(swrResponse({ data: mockDomains }));

        const { result } = renderHook(() => useUserANSDomains(USER_ADDRESS));

        expect(result.current.data).toEqual(mockDomains);
        expect(result.current.isLoading).toBe(false);
    });

    it('returns error when fetch fails', () => {
        const err = new Error('fetch failed');
        vi.mocked(useSWR).mockReturnValue(swrResponse({ error: err }));

        const { result } = renderHook(() => useUserANSDomains(USER_ADDRESS));

        expect(result.current.error).toBe(err);
        expect(result.current.data).toBeUndefined();
    });
});
