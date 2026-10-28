// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { stubFetch } from '@/app/__tests__/rpc-fetch';
import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { createTokenMarketData, createTokenMarketStats } from '../../__tests__/__fixtures__/market-data';
import { TokenMarketDataStatus } from '../types';
import { fetchTokenMarketData, useTokenMarketData } from '../use-token-market-data';

vi.mock('@/app/providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('@/app/utils/use-tab-visibility', () => ({ default: vi.fn() }));

import { useCluster } from '@/app/providers/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

const { fetchMock, respondWith } = stubFetch();

describe('fetchTokenMarketData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return Success with parsed stats', async () => {
        respondWith(200, createTokenMarketData());
        const r = await fetchTokenMarketData(['token-market-data', 'addr']);
        expect(r.status).toBe(TokenMarketDataStatus.Success);
        expect(r.stats).toEqual(createTokenMarketStats());
    });

    it('should parse stats when only price is present', async () => {
        respondWith(200, { lastUpdated: null, marketCapRank: null, price: 1.23 });
        const r = await fetchTokenMarketData(['token-market-data', 'addr']);
        expect(r.status).toBe(TokenMarketDataStatus.Success);
        expect(r.stats).toEqual({
            lastUpdated: undefined,
            marketCap: undefined,
            marketCapRank: undefined,
            price: 1.23,
            priceChange24h: undefined,
            volume24h: undefined,
        });
    });

    it('should coerce null marketCapRank to undefined', async () => {
        respondWith(200, createTokenMarketData({ marketCapRank: null }));
        expect((await fetchTokenMarketData(['token-market-data', 'addr'])).stats?.marketCapRank).toBeUndefined();
    });

    it('should return RateLimited for 429', async () => {
        respondWith(429, {});
        expect((await fetchTokenMarketData(['token-market-data', 'addr'])).status).toBe(
            TokenMarketDataStatus.RateLimited,
        );
    });

    it.each([404, 500, 502])('should return FetchFailed for %i', async status => {
        respondWith(status, {});
        expect((await fetchTokenMarketData(['token-market-data', 'addr'])).status).toBe(
            TokenMarketDataStatus.FetchFailed,
        );
    });

    it('should return FetchFailed on schema mismatch', async () => {
        respondWith(200, { unexpected: 'shape' });
        expect((await fetchTokenMarketData(['token-market-data', 'addr'])).status).toBe(
            TokenMarketDataStatus.FetchFailed,
        );
    });

    it('should return FetchFailed when the network request throws', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        expect((await fetchTokenMarketData(['token-market-data', 'addr'])).status).toBe(
            TokenMarketDataStatus.FetchFailed,
        );
    });

    it('should report a schema mismatch to Sentry', async () => {
        respondWith(200, { unexpected: 'shape' });
        await fetchTokenMarketData(['token-market-data', 'addr']);
        expect(Logger.error).toHaveBeenCalledTimes(1);
    });
});

describe('useTokenMarketData', () => {
    beforeEach(() => {
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta } as ReturnType<typeof useCluster>);
        vi.mocked(useTabVisibility).mockReturnValue({ visible: true });
    });

    const wrapper = swrWrapper({ dedupingInterval: 0, errorRetryCount: 2, errorRetryInterval: 50 });

    it('should be Success when fetch succeeds', async () => {
        respondWith(200, createTokenMarketData());
        const { result } = renderHook(() => useTokenMarketData('addr', true), { wrapper });
        await waitForHook(() => expect(result.current?.status).toBe(TokenMarketDataStatus.Success));
        expect(result.current?.stats?.price).toBe(1.23);
    });

    it('should be FetchFailed for 404 without retry', async () => {
        respondWith(404, {});
        const { result } = renderHook(() => useTokenMarketData('addr', true), { wrapper });
        await waitForHook(() => expect(result.current?.status).toBe(TokenMarketDataStatus.FetchFailed));
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['not a token mint', { cluster: Cluster.MainnetBeta, isTokenMint: false, visible: true }],
        ['non-mainnet', { cluster: Cluster.Devnet, isTokenMint: true, visible: true }],
        ['tab hidden', { cluster: Cluster.MainnetBeta, isTokenMint: true, visible: false }],
    ])('should not fetch when %s', (_l, { cluster, isTokenMint, visible }) => {
        vi.mocked(useCluster).mockReturnValue({ cluster } as ReturnType<typeof useCluster>);
        vi.mocked(useTabVisibility).mockReturnValue({ visible });
        renderHook(() => useTokenMarketData('addr', isTokenMint), { wrapper });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
