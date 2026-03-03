import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { BlupryntStatus, useBlupryntVerification } from '../use-bluprynt';

vi.mock('@/app/providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('swr', () => ({ default: vi.fn() }));

import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';

const mockSWR = (data: unknown, isLoading = false) => {
    vi.mocked(useSWR).mockReturnValue({ data, isLoading } as ReturnType<typeof useSWR>);
};

describe('useBlupryntVerification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta } as ReturnType<typeof useCluster>);
    });

    it.each([
        [BlupryntStatus.Success, true],
        [BlupryntStatus.NotFound, false],
        [BlupryntStatus.RateLimited, false],
    ])('should return %s status when verified is %s', (status, verified) => {
        mockSWR({ status, verified });
        const { result } = renderHook(() => useBlupryntVerification('mint'));
        expect(result.current).toEqual({ status, verified });
    });

    it('should return Loading when isLoading and no data', () => {
        mockSWR(undefined, true);
        const { result } = renderHook(() => useBlupryntVerification('mint'));
        expect(result.current?.status).toBe(BlupryntStatus.Loading);
    });

    it('should return FetchFailed when no data', () => {
        mockSWR(undefined);
        const { result } = renderHook(() => useBlupryntVerification('mint'));
        expect(result.current?.status).toBe(BlupryntStatus.FetchFailed);
    });

    it('should pass null key when no mintAddress or wrong cluster', () => {
        mockSWR(undefined);

        renderHook(() => useBlupryntVerification(undefined));
        expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));

        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.Devnet } as ReturnType<typeof useCluster>);
        renderHook(() => useBlupryntVerification('mint'));
        expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
    });
});
