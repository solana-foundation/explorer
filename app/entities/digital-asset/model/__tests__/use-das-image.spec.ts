import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster, clusterSlug } from '@/app/utils/cluster';

vi.mock('@/app/providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('swr', () => ({ default: vi.fn() }));

import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';

import { useDasImage } from '../use-das-image';

describe('useDasImage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta, customUrl: '' } as ReturnType<
            typeof useCluster
        >);
        vi.mocked(useSWR).mockReturnValue({ data: undefined } as ReturnType<typeof useSWR>);
    });

    it('should return undefined when no mintAddress', () => {
        const { result } = renderHook(() => useDasImage(undefined));
        expect(result.current).toBeUndefined();
        expect(useSWR).toHaveBeenCalledWith(undefined, expect.any(Function), expect.any(Object));
    });

    it('should return the image URL from SWR data', () => {
        vi.mocked(useSWR).mockReturnValue({ data: 'https://example.com/image.png' } as ReturnType<typeof useSWR>);

        const { result } = renderHook(() => useDasImage('SomeMintAddress'));
        expect(result.current).toBe('https://example.com/image.png');
    });

    it('should return undefined when SWR has no data', () => {
        const { result } = renderHook(() => useDasImage('SomeMintAddress'));
        expect(result.current).toBeUndefined();
    });

    it('should pass correct SWR key including cluster slug and customUrl', () => {
        vi.mocked(useCluster).mockReturnValue({
            cluster: Cluster.Custom,
            customUrl: 'https://custom.rpc',
        } as ReturnType<typeof useCluster>);

        renderHook(() => useDasImage('SomeMintAddress'));

        expect(useSWR).toHaveBeenCalledWith(
            ['das-image', 'SomeMintAddress', clusterSlug(Cluster.Custom), 'https://custom.rpc'],
            expect.any(Function),
            expect.any(Object),
        );
    });

    it('should pass correct SWR config', () => {
        renderHook(() => useDasImage('SomeMintAddress'));

        expect(useSWR).toHaveBeenCalledWith(expect.any(Array), expect.any(Function), {
            dedupingInterval: 5 * 60 * 1000,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        });
    });
});
