import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../errors';
import { getTokenInfo, getTokenInfos } from '../fetch-token-mints';
import { type TokenInfo } from '../types';

const mockToken: TokenInfo = {
    address: PublicKey.default.toBase58(),
    decimals: 9,
    logoURI: null,
    name: 'Wrapped SOL',
    symbol: 'SOL',
    verified: true,
};

describe('getTokenInfos', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.clearAllMocks();
    });

    it('should pass signal to fetch', async () => {
        const abortController = new AbortController();
        const mockResponse = { content: [mockToken] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
            ok: true,
        } as Response);

        await getTokenInfos([mockToken.address], Cluster.MainnetBeta, {
            signal: abortController.signal,
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                signal: abortController.signal,
            })
        );
    });

    it('should pass next options to fetch', async () => {
        const nextOptions = { revalidate: 3600, tags: ['token-info'] };
        const mockResponse = { content: [mockToken] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
            ok: true,
        } as Response);

        await getTokenInfos([mockToken.address], Cluster.MainnetBeta, {
            next: nextOptions,
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                next: nextOptions,
            })
        );
    });

    it('should call onError when fetch throws', async () => {
        const error = new Error('Network error');
        const onError = vi.fn();

        vi.mocked(global.fetch).mockRejectedValueOnce(error);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, {
            onError,
        });

        expect(onError).toHaveBeenCalledWith(error);
        expect(result).toEqual([]);
    });

    it('should return empty array for empty addresses', async () => {
        const result = await getTokenInfos([], Cluster.MainnetBeta);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('should return empty array for unsupported cluster', async () => {
        const result = await getTokenInfos([mockToken.address], Cluster.Custom);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('should call onError with TokenInfoHttpError when response is not ok', async () => {
        const onError = vi.fn();

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, { onError });

        expect(onError).toHaveBeenCalledTimes(1);
        const error = onError.mock.calls[0][0];
        expect(error).toBeInstanceOf(TokenInfoHttpError);
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Internal Server Error');
        expect(result).toEqual([]);
    });

    it('should call onError with TokenInfoInvalidResponseError when content is missing', async () => {
        const onError = vi.fn();

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({}),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, { onError });

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(TokenInfoInvalidResponseError);
        expect(result).toEqual([]);
    });

    it('should return tokens on successful response', async () => {
        const mockResponse = { content: [mockToken] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta);

        expect(result).toEqual([mockToken]);
    });
});

describe('getTokenInfo', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.clearAllMocks();
    });

    it('should return single token', async () => {
        const mockResponse = { content: [mockToken] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
            ok: true,
        } as Response);

        const result = await getTokenInfo(mockToken.address, Cluster.MainnetBeta);

        expect(result).toEqual(mockToken);
    });

    it('should return undefined when token not found', async () => {
        const mockResponse = { content: [] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
            ok: true,
        } as Response);

        const result = await getTokenInfo(mockToken.address, Cluster.MainnetBeta);

        expect(result).toBeUndefined();
    });
});
