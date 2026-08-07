import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../../lib/errors';
import { type TokenInfo } from '../../lib/types';
import { getTokenInfo, getTokenInfos } from '../fetch-token-mints';

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

        await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, {
            signal: abortController.signal,
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                signal: abortController.signal,
            }),
        );
    });

    it('should pass next options to fetch', async () => {
        const nextOptions = { revalidate: 3600, tags: ['token-info'] };
        const mockResponse = { content: [mockToken] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
            ok: true,
        } as Response);

        await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, {
            next: nextOptions,
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                next: nextOptions,
            }),
        );
    });

    it('should call onError when fetch throws', async () => {
        const error = new Error('Network error');
        const onError = vi.fn();

        vi.mocked(global.fetch).mockRejectedValueOnce(error);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, {
            onError,
        });

        expect(onError).toHaveBeenCalledWith(error);
        expect(result).toEqual([]);
    });

    it('should return empty array for empty addresses', async () => {
        const result = await getTokenInfos([], Cluster.MainnetBeta, undefined);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('should return empty array for unsupported cluster', async () => {
        const result = await getTokenInfos([mockToken.address], Cluster.Custom, undefined);

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

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, { onError });

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

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, { onError });

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(TokenInfoInvalidResponseError);
        expect(result).toEqual([]);
    });

    it('should call onError with TokenInfoInvalidResponseError when content is not an array', async () => {
        const onError = vi.fn();

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ content: { [mockToken.address]: mockToken } }),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, { onError });

        expect(onError.mock.calls[0][0]).toBeInstanceOf(TokenInfoInvalidResponseError);
        expect(result).toEqual([]);
    });

    // A batch is worth more than its worst entry: dropping one malformed token keeps the symbols
    // of every other mint in the transaction.
    it('should drop a malformed token, keep the rest, and report the drop', async () => {
        const onError = vi.fn();
        const malformed = { ...mockToken, decimals: '9' };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ content: [malformed, mockToken] }),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, { onError });

        expect(result).toEqual([mockToken]);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(TokenInfoInvalidResponseError);
    });

    // UTL omits these keys rather than sending null for some tokens. Requiring them would drop the
    // token outright, losing the name and symbol over a missing logo — the failure this whole path
    // exists to prevent. `discover-with-utl.ts` reads the same API and treats both as optional.
    it('should keep a token that omits logoURI, reporting the logo as null', async () => {
        const onError = vi.fn();
        const withoutLogo = { address: mockToken.address, decimals: 9, name: 'Wrapped SOL', symbol: 'SOL' };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ content: [withoutLogo] }),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, { onError });

        expect(result).toEqual([{ ...withoutLogo, logoURI: null }]);
        expect(onError).not.toHaveBeenCalled();
    });

    it('should keep a token that omits decimals, reporting them as null', async () => {
        const onError = vi.fn();
        const withoutDecimals = { address: mockToken.address, logoURI: null, name: 'Wrapped SOL', symbol: 'SOL' };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ content: [withoutDecimals] }),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined, { onError });

        expect(result).toEqual([{ ...withoutDecimals, decimals: null }]);
        expect(onError).not.toHaveBeenCalled();
    });

    it('should keep a token that carries fields the app does not read', async () => {
        const withExtras = { ...mockToken, chainId: 101, holders: null, tags: ['lp-token'] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ content: [withExtras] }),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined);

        expect(result).toEqual([withExtras]);
    });

    it('should return tokens on successful response', async () => {
        const mockResponse = { content: [mockToken] };

        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
            ok: true,
        } as Response);

        const result = await getTokenInfos([mockToken.address], Cluster.MainnetBeta, undefined);

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
