import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { CoingeckoStatus, fetchCoinGeckoVerification, RATE_LIMITED, useCoinGeckoVerification } from '../use-coingecko';

vi.mock('@/app/providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('@/app/utils/use-tab-visibility', () => ({ default: vi.fn() }));

import { useCluster } from '@/app/providers/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

const VALID_RESPONSE = {
    last_updated: '2025-01-01T00:00:00Z',
    market_cap_rank: 5,
    market_data: {
        current_price: { usd: 1.23 },
        market_cap: { usd: 1_000_000 },
        price_change_percentage_24h_in_currency: { usd: 0.67 },
        total_volume: { usd: 500_000 },
    },
};

let fetchSpy: MockInstance;

function mockResponse(status: number, body: unknown = {}) {
    fetchSpy.mockResolvedValueOnce({
        json: async () => body,
        ok: status >= 200 && status < 300,
        status,
    } as Response);
}

describe('fetchCoinGeckoVerification', () => {
    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return Success with parsed coin info', async () => {
        mockResponse(200, VALID_RESPONSE);
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result.status).toBe(CoingeckoStatus.Success);
        expect(result.coinInfo).toEqual({
            last_updated: new Date('2025-01-01T00:00:00Z'),
            market_cap: 1_000_000,
            market_cap_rank: 5,
            price: 1.23,
            price_change_percentage_24h: 0.67,
            volume_24: 500_000,
        });
    });

    it('should convert null market_cap_rank to undefined', async () => {
        mockResponse(200, { ...VALID_RESPONSE, market_cap_rank: null });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result.coinInfo?.market_cap_rank).toBeUndefined();
    });

    it('should return FetchFailed for 404 (permanent, cacheable)', async () => {
        mockResponse(404);
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result.status).toBe(CoingeckoStatus.FetchFailed);
    });

    it.each([
        [429, RATE_LIMITED],
        [500, 'CoinGecko API error: 500'],
        [502, 'CoinGecko API error: 502'],
    ])('should throw for %i so SWR retries', async (status, expectedMessage) => {
        mockResponse(status);
        await expect(fetchCoinGeckoVerification(['coingecko', 'address'])).rejects.toThrow(expectedMessage);
    });

    it('should throw when response does not match schema', async () => {
        mockResponse(200, { unexpected: 'shape' });
        await expect(fetchCoinGeckoVerification(['coingecko', 'address'])).rejects.toThrow(
            'CoinGecko schema validation failed',
        );
    });

    it('should let network errors propagate for SWR retry', async () => {
        fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        await expect(fetchCoinGeckoVerification(['coingecko', 'address'])).rejects.toThrow('Failed to fetch');
    });
});

describe('useCoinGeckoVerification', () => {
    beforeEach(() => {
        fetchSpy = vi.spyOn(globalThis, 'fetch');
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta } as ReturnType<typeof useCluster>);
        vi.mocked(useTabVisibility).mockReturnValue({ visible: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function wrapper({ children }: { children: ReactNode }) {
        return createElement(
            SWRConfig,
            {
                value: {
                    dedupingInterval: 0,
                    errorRetryCount: 2,
                    errorRetryInterval: 50,
                    provider: () => new Map(),
                },
            },
            children,
        );
    }

    it('should return Success when fetch succeeds', async () => {
        mockResponse(200, VALID_RESPONSE);
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });
        await waitFor(() => expect(result.current?.status).toBe(CoingeckoStatus.Success));
        expect(result.current?.coinInfo?.price).toBe(1.23);
    });

    it('should return FetchFailed for 404 without retrying', async () => {
        mockResponse(404);
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });
        await waitFor(() => expect(result.current?.status).toBe(CoingeckoStatus.FetchFailed));
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it.each([
        [429, CoingeckoStatus.RateLimited],
        [500, CoingeckoStatus.FetchFailed],
        [502, CoingeckoStatus.FetchFailed],
    ])('should recover after transient %i on retry', async status => {
        mockResponse(status);
        mockResponse(200, VALID_RESPONSE);
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });

        await waitFor(() => expect(result.current?.status).toBe(CoingeckoStatus.Success), { timeout: 3000 });
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it.each([
        [429, CoingeckoStatus.RateLimited],
        [500, CoingeckoStatus.FetchFailed],
    ])('should map %i to correct status when retries exhausted', async (status, expectedStatus) => {
        // Fill enough responses for initial + retries
        mockResponse(status);
        mockResponse(status);
        mockResponse(status);
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });

        await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3), { timeout: 3000 });
        expect(result.current?.status).toBe(expectedStatus);
    });

    it.each([
        ['not enabled', { cluster: Cluster.MainnetBeta, enabled: false, visible: true }],
        ['non-mainnet cluster', { cluster: Cluster.Devnet, enabled: true, visible: true }],
        ['tab not visible', { cluster: Cluster.MainnetBeta, enabled: true, visible: false }],
    ])('should not fetch when %s', (_label, { cluster, enabled, visible }) => {
        vi.mocked(useCluster).mockReturnValue({ cluster } as ReturnType<typeof useCluster>);
        vi.mocked(useTabVisibility).mockReturnValue({ visible });
        renderHook(() => useCoinGeckoVerification('address', enabled), { wrapper });
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
