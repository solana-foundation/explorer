import { GENESIS_HASHES } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';

import { jupiterToken } from '../../__fixtures__/jupiter-token';
import { redactedTokenInfo, tokenInfo } from '../../__fixtures__/token-info';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../../lib/errors';
import { JUPITER_TOKENS_SEARCH_URL } from '../../lib/jupiter-token';
import type { TokenInfo } from '../../lib/types';
import { getTokenInfo, getTokenInfos } from '../fetch-token-infos-from-jupiter';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

const fetchMock = vi.fn();

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('JUPITER_API_KEY', 'test-key');
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    fetchMock.mockReset();
});

describe('getTokenInfos', () => {
    it('should search Jupiter for the mints with the API key', async () => {
        respond(200, []);

        await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

        const [url, init] = fetchMock.mock.calls[0];
        const requested = new URL(url);
        expect(`${requested.origin}${requested.pathname}`).toBe(JUPITER_TOKENS_SEARCH_URL);
        expect(requested.searchParams.get('query')).toBe(`${MINT_A},${MINT_B}`);
        expect(init.headers['x-api-key']).toBe('test-key');
    });

    it('should keep each response in the Next data cache', async () => {
        respond(200, []);

        await getTokenInfos([MINT_A], Cluster.MainnetBeta);

        expect(fetchMock.mock.calls[0][1].next.revalidate).toBeGreaterThan(0);
    });

    it('should answer nothing listed without a request on devnet', async () => {
        expect(await getTokenInfos([MINT_A], Cluster.Devnet)).toEqual(resolved([]));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should search Jupiter for a custom cluster with the mainnet genesis hash', async () => {
        respond(200, [jupiterToken(MINT_A)]);

        const result = await getTokenInfos([MINT_A], Cluster.Custom, GENESIS_HASHES.MAINNET);

        expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
    });

    it('should answer unavailable without a request when JUPITER_API_KEY is not set', async () => {
        vi.stubEnv('JUPITER_API_KEY', '');

        const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

        expect(result).toEqual({ error: new Error('JUPITER_API_KEY is not configured'), kind: 'unavailable' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should map a Jupiter token to token info', async () => {
        respond(200, [
            {
                decimals: 9,
                holderCount: 5,
                icon: 'https://example.com/a.png',
                id: MINT_A,
                isVerified: true,
                name: 'Token A',
                symbol: 'TKA',
                tags: ['verified'],
            },
        ]);

        expect(await getTokenInfos([MINT_A], Cluster.MainnetBeta)).toEqual(
            resolved([
                {
                    address: MINT_A,
                    decimals: 9,
                    logoURI: 'https://example.com/a.png',
                    name: 'Token A',
                    symbol: 'TKA',
                    verified: true,
                },
            ]),
        );
    });

    it('should keep the verified flag of a redacted mint and drop its name, symbol and logo', async () => {
        vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT_A);
        respond(200, [
            jupiterToken(MINT_A, { icon: 'https://example.com/a.png', isVerified: true }),
            jupiterToken(MINT_B),
        ]);

        const result = await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

        expect(result).toEqual(resolved([redactedTokenInfo(MINT_A, true), tokenInfo(MINT_B)]));
    });

    it('should leave out a mint with an empty name without counting it as malformed', async () => {
        respond(200, [jupiterToken(MINT_A, { name: '' }), jupiterToken(MINT_B)]);

        const result = await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

        expect(result).toEqual(resolved([tokenInfo(MINT_B)]));
    });

    it('should drop a token for a mint that was not requested', async () => {
        respond(200, [jupiterToken(MINT_A), jupiterToken(MINT_B)]);

        const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

        expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
    });

    it('should split 101 mints into a request of 100 and a request of 1', async () => {
        const mints = Array.from({ length: 101 }, (_, i) => gen.address(i));
        respond(200, []);
        respond(200, []);

        await getTokenInfos(mints, Cluster.MainnetBeta);

        const queries = fetchMock.mock.calls.map(([url]) => new URL(url).searchParams.get('query')?.split(','));
        expect(queries.map(query => query?.length)).toEqual([100, 1]);
    });

    it('should join the tokens and the malformed counts of every request', async () => {
        const mints = Array.from({ length: 101 }, (_, i) => gen.address(i));
        respond(200, [{ id: mints[0] }, jupiterToken(mints[0])]);
        respond(200, [{ id: mints[100] }, jupiterToken(mints[100])]);

        const result = await getTokenInfos(mints, Cluster.MainnetBeta);

        expect(result).toEqual(resolved([tokenInfo(mints[0]), tokenInfo(mints[100])], 2));
    });

    it('should answer unavailable when one of the requests fails', async () => {
        const mints = Array.from({ length: 101 }, (_, i) => gen.address(i));
        respond(200, [jupiterToken(mints[0])]);
        respond(429, {});

        const result = await getTokenInfos(mints, Cluster.MainnetBeta);

        expect(result).toEqual({ error: expect.any(TokenInfoHttpError), kind: 'unavailable' });
    });
});

describe('getTokenInfo', () => {
    it('should return the token of the mint', async () => {
        respond(200, [jupiterToken(MINT_A)]);

        expect(await getTokenInfo(MINT_A, Cluster.MainnetBeta)).toEqual(tokenInfo(MINT_A));
    });

    it('should return undefined for a mint that is not listed', async () => {
        const onError = vi.fn();
        respond(200, []);

        expect(await getTokenInfo(MINT_A, Cluster.MainnetBeta, undefined, { onError })).toBeUndefined();
        expect(onError).not.toHaveBeenCalled();
    });

    it('should report a malformed entry', async () => {
        const onError = vi.fn();
        respond(200, [{ id: MINT_A }]);

        expect(await getTokenInfo(MINT_A, Cluster.MainnetBeta, undefined, { onError })).toBeUndefined();
        expect(onError).toHaveBeenCalledWith(expect.any(TokenInfoInvalidResponseError));
    });

    it('should return undefined and report the error when Jupiter is unavailable', async () => {
        const onError = vi.fn();
        respond(503, {});

        expect(await getTokenInfo(MINT_A, Cluster.MainnetBeta, undefined, { onError })).toBeUndefined();
        expect(onError).toHaveBeenCalledWith(expect.any(TokenInfoHttpError));
    });
});

function respond(status: number, body: unknown) {
    fetchMock.mockResolvedValueOnce({
        json: () => Promise.resolve(body),
        ok: status >= 200 && status < 300,
        status,
        statusText: `status ${status}`,
    });
}

function resolved(tokens: TokenInfo[], malformed = 0) {
    return { kind: 'resolved', malformed, tokens };
}
