import { GENESIS_HASHES } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';

import { tokenInfo } from '../../__fixtures__/token-info';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../../lib/errors';
import { JUPITER_TOKENS_SEARCH_URL } from '../../lib/jupiter-token';
import type { TokenInfo } from '../../lib/types';
import { getTokenInfo, getTokenInfos } from '../fetch-token-infos-from-jupiter';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);
const MINT_C = gen.address(3);

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
    describe('the request', () => {
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

        it('should pass the signal to fetch', async () => {
            respond(200, []);
            const { signal } = new AbortController();

            await getTokenInfos([MINT_A], Cluster.MainnetBeta, undefined, { signal });

            expect(fetchMock.mock.calls[0][1].signal).toBe(signal);
        });

        it('should split 101 mints into a request of 100 and a request of 1', async () => {
            const mints = Array.from({ length: 101 }, (_, i) => gen.address(i));
            respond(200, []);
            respond(200, []);

            await getTokenInfos(mints, Cluster.MainnetBeta);

            const queries = fetchMock.mock.calls.map(([url]) => new URL(url).searchParams.get('query')?.split(','));
            expect(queries.map(query => query?.length)).toEqual([100, 1]);
        });

        it('should send no request for an empty list', async () => {
            expect(await getTokenInfos([], Cluster.MainnetBeta)).toEqual(resolved([]));
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it.each([
            ['devnet', Cluster.Devnet, undefined],
            ['testnet', Cluster.Testnet, undefined],
            ['a custom cluster with an unknown genesis hash', Cluster.Custom, 'unknown'],
        ])('should answer nothing listed without a request on %s', async (_, cluster, genesisHash) => {
            expect(await getTokenInfos([MINT_A], cluster, genesisHash)).toEqual(resolved([]));
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
    });

    describe('a redacted mint', () => {
        it('should answer nothing listed without a request when every mint is redacted', async () => {
            vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT_A);

            expect(await getTokenInfos([MINT_A], Cluster.MainnetBeta)).toEqual(resolved([]));
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should search Jupiter for the other mints and leave the redacted one out', async () => {
            vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT_A);
            respond(200, [jupiterToken(MINT_A), jupiterToken(MINT_B)]);

            const result = await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

            expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('query')).toBe(MINT_B);
            expect(result).toEqual(resolved([tokenInfo(MINT_B)]));
        });

        it.each([
            ['unset', undefined],
            ['empty', ''],
        ])('should search Jupiter for every mint when NEXT_PUBLIC_BAD_TOKENS is %s', async (_, badTokens) => {
            vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', badTokens);
            respond(200, [jupiterToken(MINT_A), jupiterToken(MINT_B)]);

            const result = await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

            expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('query')).toBe(`${MINT_A},${MINT_B}`);
            expect(result).toEqual(resolved([tokenInfo(MINT_A), tokenInfo(MINT_B)]));
        });

        it('should match a redacted mint that has spaces around it in the list', async () => {
            vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', ` ${MINT_C} , ${MINT_A} `);
            respond(200, [jupiterToken(MINT_B)]);

            const result = await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

            expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('query')).toBe(MINT_B);
            expect(result).toEqual(resolved([tokenInfo(MINT_B)]));
        });
    });

    describe('a 200 response', () => {
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

        it.each([
            ['absent', { isVerified: undefined }, false],
            ['false', { isVerified: false }, false],
            ['true', { isVerified: true }, true],
        ])('should map an isVerified that is %s to verified %s', async (_, flag, verified) => {
            respond(200, [jupiterToken(MINT_A, flag)]);

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual(resolved([tokenInfo(MINT_A, verified)]));
        });

        it.each([
            ['null', { icon: null }],
            ['absent', { icon: undefined }],
        ])('should map an icon that is %s to a null logo', async (_, icon) => {
            respond(200, [jupiterToken(MINT_A, icon)]);

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
        });

        it('should map absent decimals to null', async () => {
            respond(200, [jupiterToken(MINT_A, { decimals: undefined })]);

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual(resolved([{ ...tokenInfo(MINT_A), decimals: null }]));
        });

        it.each([
            ['an empty name', { name: '' }],
            ['an empty symbol', { symbol: '' }],
        ])('should leave out a mint with %s without counting it as malformed', async (_, empty) => {
            respond(200, [jupiterToken(MINT_A, empty), jupiterToken(MINT_B)]);

            const result = await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

            expect(result).toEqual(resolved([tokenInfo(MINT_B)]));
        });

        it.each([
            ['no id', { id: undefined }],
            ['no name', { name: undefined }],
            ['no symbol', { symbol: undefined }],
            ['string decimals', { decimals: '6' }],
        ])('should drop an entry with %s, keep the rest and count it', async (_, broken) => {
            respond(200, [jupiterToken(MINT_A, broken), jupiterToken(MINT_B)]);

            const result = await getTokenInfos([MINT_A, MINT_B], Cluster.MainnetBeta);

            expect(result).toEqual(resolved([tokenInfo(MINT_B)], 1));
        });

        it.each([
            ['null', null],
            ['a string', 'nope'],
            ['an object', { content: [] }],
        ])('should drop an entry that is %s and count it', async (_, entry) => {
            respond(200, [entry, jupiterToken(MINT_A)]);

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual(resolved([tokenInfo(MINT_A)], 1));
        });

        it('should leave out a token for a mint that was not requested', async () => {
            respond(200, [jupiterToken(MINT_A), jupiterToken(MINT_B)]);

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
        });

        it('should answer nothing listed for an empty array', async () => {
            respond(200, []);

            expect(await getTokenInfos([MINT_A], Cluster.MainnetBeta)).toEqual(resolved([]));
        });

        it.each([
            ['an object', { content: [] }],
            ['null', null],
            ['a string', 'nope'],
        ])('should answer unavailable for a body that is %s', async (_, body) => {
            respond(200, body);

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual({ error: expect.any(TokenInfoInvalidResponseError), kind: 'unavailable' });
        });

        it('should answer unavailable for a body that is not JSON', async () => {
            fetchMock.mockResolvedValueOnce({
                json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
                ok: true,
                status: 200,
            });

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual({ error: expect.any(SyntaxError), kind: 'unavailable' });
        });

        it('should join the tokens and the malformed counts of every request', async () => {
            const mints = Array.from({ length: 101 }, (_, i) => gen.address(i));
            respond(200, [{ id: mints[0] }, jupiterToken(mints[0])]);
            respond(200, [{ id: mints[100] }, jupiterToken(mints[100])]);

            const result = await getTokenInfos(mints, Cluster.MainnetBeta);

            expect(result).toEqual(resolved([tokenInfo(mints[0]), tokenInfo(mints[100])], 2));
        });
    });

    describe('a failed request', () => {
        it.each([401, 429, 500, 503])('should answer unavailable with the status of a %i', async status => {
            respond(status, { error: 'nope' });

            const result = await getTokenInfos([MINT_A], Cluster.MainnetBeta);

            expect(result).toEqual({ error: expect.any(TokenInfoHttpError), kind: 'unavailable' });
            expect(result.kind === 'unavailable' && result.error).toMatchObject({ status });
        });

        it('should answer unavailable with the error of a network failure', async () => {
            const error = new TypeError('fetch failed');
            fetchMock.mockRejectedValueOnce(error);

            expect(await getTokenInfos([MINT_A], Cluster.MainnetBeta)).toEqual({ error, kind: 'unavailable' });
        });

        it('should answer unavailable with the error of an abort', async () => {
            const error = new DOMException('The operation was aborted.', 'AbortError');
            fetchMock.mockRejectedValueOnce(error);

            expect(await getTokenInfos([MINT_A], Cluster.MainnetBeta)).toEqual({ error, kind: 'unavailable' });
        });

        it('should answer unavailable when one of the requests fails', async () => {
            const mints = Array.from({ length: 101 }, (_, i) => gen.address(i));
            respond(200, [jupiterToken(mints[0])]);
            respond(429, {});

            const result = await getTokenInfos(mints, Cluster.MainnetBeta);

            expect(result).toEqual({ error: expect.any(TokenInfoHttpError), kind: 'unavailable' });
        });
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

function jupiterToken(id: string, overrides: Record<string, unknown> = {}) {
    return { decimals: 6, icon: null, id, isVerified: false, name: id, symbol: id, ...overrides };
}

function resolved(tokens: TokenInfo[], malformed = 0) {
    return { kind: 'resolved', malformed, tokens };
}
