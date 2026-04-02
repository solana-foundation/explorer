import { Cluster } from '@utils/cluster';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { searchTokens, TOKEN_SEARCH_API_URL } from '../token-search';

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn() },
}));

function mockTokenResponse(content: object[]) {
    return new Response(JSON.stringify({ content }));
}

const USDC = {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chainId: 101,
    decimals: 6,
    holders: 1_000_000,
    logoUri: 'https://example.com/usdc.png',
    name: 'USD Coin',
    symbol: 'USDC',
    tags: ['stablecoin'],
    verified: true,
};

describe('searchTokens', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.NEXT_PUBLIC_DISABLE_TOKEN_SEARCH;
    });

    it('should return mapped search items on success', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockTokenResponse([USDC]));

        const results = await searchTokens('USDC', Cluster.MainnetBeta);

        expect(results).toEqual([
            {
                label: 'USD Coin',
                pathname: '/address/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                value: ['USD Coin', 'USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
            },
        ]);
    });

    it('should pass correct query params to the API', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockTokenResponse([]));

        await searchTokens('SOL', Cluster.MainnetBeta);

        const url = new URL(fetchSpy.mock.calls[0][0] as string);
        expect(url.origin + url.pathname).toBe(TOKEN_SEARCH_API_URL);
        expect(url.searchParams.get('query')).toBe('SOL');
        expect(url.searchParams.get('chainId')).toBe('101');
        expect(url.searchParams.get('start')).toBe('0');
        expect(url.searchParams.get('limit')).toBe('20');
    });

    it('should use correct chainId for testnet', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockTokenResponse([]));

        await searchTokens('SOL', Cluster.Testnet);

        const url = new URL(fetchSpy.mock.calls[0][0] as string);
        expect(url.searchParams.get('chainId')).toBe('102');
    });

    it('should use correct chainId for devnet', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockTokenResponse([]));

        await searchTokens('SOL', Cluster.Devnet);

        const url = new URL(fetchSpy.mock.calls[0][0] as string);
        expect(url.searchParams.get('chainId')).toBe('103');
    });

    it('should return empty for clusters without a chainId', async () => {
        const results = await searchTokens('SOL', Cluster.Custom);
        expect(results).toEqual([]);
    });

    it('should return empty when query is empty', async () => {
        const results = await searchTokens('', Cluster.MainnetBeta);
        expect(results).toEqual([]);
    });

    it('should return empty when NEXT_PUBLIC_DISABLE_TOKEN_SEARCH is set', async () => {
        process.env.NEXT_PUBLIC_DISABLE_TOKEN_SEARCH = 'true';

        const results = await searchTokens('USDC', Cluster.MainnetBeta);
        expect(results).toEqual([]);
    });

    it('should return empty and log on non-ok response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('error', { status: 500 }));

        const { Logger } = await import('@/app/shared/lib/logger');
        const results = await searchTokens('USDC', Cluster.MainnetBeta);

        expect(results).toEqual([]);
        expect(Logger.error).toHaveBeenCalled();
    });

    it('should return empty and log on network error', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network failure'));

        const { Logger } = await import('@/app/shared/lib/logger');
        const results = await searchTokens('USDC', Cluster.MainnetBeta);

        expect(results).toEqual([]);
        expect(Logger.error).toHaveBeenCalled();
    });

    it('should abort fetch after timeout', async () => {
        vi.useFakeTimers();

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
                }),
        );

        const resultPromise = searchTokens('USDC', Cluster.MainnetBeta);

        vi.advanceTimersByTime(5_000);

        const results = await resultPromise;
        expect(results).toEqual([]);
        expect(fetchSpy).toHaveBeenCalled();

        vi.useRealTimers();
    });
});
