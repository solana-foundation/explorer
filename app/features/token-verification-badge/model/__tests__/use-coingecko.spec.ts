import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { CoingeckoStatus, fetchCoinGeckoVerification, useCoinGeckoVerification } from '../use-coingecko';

vi.mock('@/app/providers/cluster', () => ({ useCluster: vi.fn() }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), panic: vi.fn(), warn: vi.fn() } }));
vi.mock('@/app/utils/use-tab-visibility', () => ({ default: vi.fn() }));

import { useCluster } from '@/app/providers/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

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
        vi.clearAllMocks();
        fetchSpy = vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return Success with verified true', async () => {
        mockResponse(200, { verified: true });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.Success, verified: true });
    });

    it('should return Success with verified false', async () => {
        mockResponse(200, { verified: false });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.Success, verified: false });
    });

    it('should return the coinGeckoId when present', async () => {
        mockResponse(200, { coinGeckoId: 'usd-coin', verified: true });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ coinGeckoId: 'usd-coin', status: CoingeckoStatus.Success, verified: true });
    });

    it('should return RateLimited for 429', async () => {
        mockResponse(429);
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.RateLimited, verified: false });
    });

    it.each([404, 500, 502])('should return FetchFailed for %i', async status => {
        mockResponse(status);
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.FetchFailed, verified: false });
    });

    it('should return FetchFailed when response does not match schema', async () => {
        mockResponse(200, { unexpected: 'shape' });
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.FetchFailed, verified: false });
    });

    it('should return FetchFailed when the network request throws', async () => {
        fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const result = await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(result).toEqual({ status: CoingeckoStatus.FetchFailed, verified: false });
    });

    it('should report a schema mismatch to Sentry', async () => {
        mockResponse(200, { unexpected: 'shape' });
        await fetchCoinGeckoVerification(['coingecko', 'address']);
        expect(Logger.error).toHaveBeenCalledTimes(1);
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
        mockResponse(200, { verified: true });
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });
        await waitFor(() => expect(result.current?.status).toBe(CoingeckoStatus.Success));
        expect(result.current?.verified).toBe(true);
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
    ])('should map %i to %s without retrying', async (status, expectedStatus) => {
        mockResponse(status);
        const { result } = renderHook(() => useCoinGeckoVerification('address'), { wrapper });

        await waitFor(() => expect(result.current?.status).toBe(expectedStatus));
        expect(fetchSpy).toHaveBeenCalledTimes(1);
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
