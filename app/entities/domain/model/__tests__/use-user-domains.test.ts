// @vitest-environment jsdom

import { useCluster } from '@providers/cluster';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserANSDomains } from '../use-user-ans-domains';
import { useUserSnsDomains } from '../use-user-sns-domains';

vi.mock('@providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('swr', () => ({ default: vi.fn() }));

const USER_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

function mockCluster(cluster: Cluster) {
    vi.mocked(useCluster).mockReturnValue({ cluster } as ReturnType<typeof useCluster>);
}

describe.each([
    ['useUserANSDomains', useUserANSDomains, 'user-ans-domains'],
    ['useUserSnsDomains', useUserSnsDomains, 'user-sns-domains'],
])('%s', (_name, useUserDomains, swrKey) => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        ['the cluster is not Mainnet or Custom', Cluster.Devnet, USER_ADDRESS],
        ['userAddress is empty', Cluster.MainnetBeta, ''],
    ])('should not request when %s', (_label, cluster, userAddress) => {
        mockCluster(cluster);

        renderHook(() => useUserDomains(userAddress));

        expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
    });

    it.each([
        ['Mainnet', Cluster.MainnetBeta],
        ['a Custom cluster', Cluster.Custom],
    ])('should request with the SWR key on %s and return the SWR response', (_label, cluster) => {
        mockCluster(cluster);
        const response = { data: [{ address: 'addr1', name: 'alice.abc' }] } as ReturnType<typeof useSWR>;
        vi.mocked(useSWR).mockReturnValue(response);

        const { result } = renderHook(() => useUserDomains(USER_ADDRESS));

        expect(useSWR).toHaveBeenCalledWith(
            [swrKey, USER_ADDRESS],
            expect.any(Function),
            expect.objectContaining({ revalidateOnFocus: false }),
        );
        expect(result.current).toBe(response);
    });
});
