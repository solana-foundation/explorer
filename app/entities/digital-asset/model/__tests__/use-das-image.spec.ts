import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster, clusterSelection, clusterSlug } from '@/app/utils/cluster';

vi.mock('@/app/providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('swr', () => ({ default: vi.fn() }));

import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';

import { useDasImage } from '../use-das-image';

describe('useDasImage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCluster).mockReturnValue({
            ...clusterSelection(Cluster.MainnetBeta),
        } as ReturnType<typeof useCluster>);
        vi.mocked(useSWR).mockReturnValue({ data: undefined } as ReturnType<typeof useSWR>);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
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

    it('should pass an SWR key of cluster slug and mint, without any customUrl', () => {
        vi.mocked(useCluster).mockReturnValue({
            ...clusterSelection(Cluster.Custom, 'https://custom.rpc'),
        } as ReturnType<typeof useCluster>);

        renderHook(() => useDasImage('SomeMintAddress'));

        expect(useSWR).toHaveBeenCalledWith(
            ['das-image', 'SomeMintAddress', clusterSlug(Cluster.Custom)],
            expect.any(Function),
            expect.any(Object),
        );
    });

    it('should request the token image without a customUrl param, even on the Custom cluster', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ image: undefined }), ok: true });
        vi.stubGlobal('fetch', fetchMock);
        vi.mocked(useCluster).mockReturnValue({
            ...clusterSelection(Cluster.Custom, 'https://custom.rpc'),
        } as ReturnType<typeof useCluster>);

        renderHook(() => useDasImage('SomeMintAddress'));

        // useSWR is mocked, so drive the fetcher it was handed with the produced key.
        const [key, fetcher] = vi.mocked(useSWR).mock.calls[0];
        await (fetcher as unknown as (k: unknown) => Promise<unknown>)(key);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const requestedUrl = String(fetchMock.mock.calls[0][0]);
        expect(requestedUrl).toContain('cluster=custom');
        expect(requestedUrl).not.toContain('customUrl');
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
