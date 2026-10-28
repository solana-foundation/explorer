// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { stubFetch } from '@/app/__tests__/rpc-fetch';
import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { CoingeckoStatus, fetchCoinGeckoVerification, useCoinGeckoVerification } from '../use-coingecko';

vi.mock('@/app/providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('@/app/utils/use-tab-visibility', () => ({ default: vi.fn() }));

import { useCluster } from '@/app/providers/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

const { fetchMock, respondWith } = stubFetch();

describe('fetchCoinGeckoVerification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return Success with verified true', async () => {
        respondWith(200, { verified: true });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.Success, verified: true });
    });

    it('should return Success with verified false', async () => {
        respondWith(200, { verified: false });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.Success, verified: false });
    });

    it('should return the coinGeckoId when present', async () => {
        respondWith(200, { coinGeckoId: 'usd-coin', verified: true });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ coinGeckoId: 'usd-coin', status: CoingeckoStatus.Success, verified: true });
    });

    it('should return RateLimited for 429', async () => {
        respondWith(429, {});
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.RateLimited, verified: false });
    });

    it.each([404, 500, 502])('should return FetchFailed for %i', async status => {
        respondWith(status, {});
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.FetchFailed, verified: false });
    });

    it('should return FetchFailed when response does not match schema', async () => {
        respondWith(200, { unexpected: 'shape' });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.FetchFailed, verified: false });
    });

    it('should return FetchFailed when the network request throws', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.FetchFailed, verified: false });
    });

    it('should report a schema mismatch to Sentry', async () => {
        respondWith(200, { unexpected: 'shape' });
        await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(Logger.error).toHaveBeenCalledTimes(1);
    });
});

describe('useCoinGeckoVerification', () => {
    beforeEach(() => {
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta } as ReturnType<typeof useCluster>);
        vi.mocked(useTabVisibility).mockReturnValue({ visible: true });
    });

    const wrapper = swrWrapper({ dedupingInterval: 0, errorRetryCount: 2, errorRetryInterval: 50 });

    it('should return Success when fetch succeeds', async () => {
        respondWith(200, { verified: true });
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });
        await waitForHook(() => expect(result.current?.status).toBe(CoingeckoStatus.Success));
        expect(result.current?.verified).toBe(true);
    });

    it.each([
        [404, CoingeckoStatus.FetchFailed],
        [429, CoingeckoStatus.RateLimited],
        [500, CoingeckoStatus.FetchFailed],
        [502, CoingeckoStatus.FetchFailed],
    ])('should map %i to %s without retrying', async (status, expectedStatus) => {
        respondWith(status, {});
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });

        await waitForHook(() => expect(result.current?.status).toBe(expectedStatus));
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['not enabled', { cluster: Cluster.MainnetBeta, enabled: false, visible: true }],
        ['non-mainnet cluster', { cluster: Cluster.Devnet, enabled: true, visible: true }],
        ['tab not visible', { cluster: Cluster.MainnetBeta, enabled: true, visible: false }],
    ])('should not fetch when %s', (_label, { cluster, enabled, visible }) => {
        vi.mocked(useCluster).mockReturnValue({ cluster } as ReturnType<typeof useCluster>);
        vi.mocked(useTabVisibility).mockReturnValue({ visible });
        renderHook(() => useCoinGeckoVerification('address', enabled), { wrapper });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
