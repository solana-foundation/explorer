import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';

import { jupiterToken } from '../../__fixtures__/jupiter-token';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../../lib/errors';
import { searchJupiterTokens } from '../search-jupiter-tokens';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);
const MINT_C = gen.address(3);

const API_KEY = 'test-key';
const QUERY = 'wrapped sol, usd & co';

const fetchMock = vi.fn();

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
});

describe('searchJupiterTokens', () => {
    describe('the request', () => {
        it('should send the encoded query and the API key to Jupiter', async () => {
            fetchMock.mockResolvedValueOnce(Response.json([]));

            await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

            const [url, init] = fetchMock.mock.calls[0];
            expect(url).toBe('https://api.jup.ag/tokens/v2/search?query=wrapped%20sol%2C%20usd%20%26%20co');
            expect(init.headers).toEqual({ Accept: 'application/json', 'x-api-key': API_KEY });
        });

        it('should send no Next cache option without a revalidate value', async () => {
            fetchMock.mockResolvedValueOnce(Response.json([]));

            await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

            expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('next');
        });

        it('should pass the revalidate value to the Next cache', async () => {
            fetchMock.mockResolvedValueOnce(Response.json([]));

            await searchJupiterTokens({ apiKey: API_KEY, query: QUERY, revalidate: 60 });

            expect(fetchMock.mock.calls[0][1].next).toEqual({ revalidate: 60 });
        });
    });

    describe('a 200 response', () => {
        it('should answer every entry of an array of valid entries', async () => {
            fetchMock.mockResolvedValueOnce(Response.json([jupiterToken(MINT_A), jupiterToken(MINT_B)]));

            const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

            expect(result).toEqual({
                kind: 'resolved',
                malformed: 0,
                tokens: [jupiterToken(MINT_A), jupiterToken(MINT_B)],
            });
        });

        it('should answer the valid entries and the malformed count', async () => {
            fetchMock.mockResolvedValueOnce(
                Response.json([jupiterToken(MINT_A), { id: MINT_B }, jupiterToken(MINT_C)]),
            );

            const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

            expect(result).toEqual({
                kind: 'resolved',
                malformed: 1,
                tokens: [jupiterToken(MINT_A), jupiterToken(MINT_C)],
            });
        });

        it.each([
            ['an object', { content: [] }],
            ['null', null],
        ])('should answer unavailable for a body that is %s', async (_, body) => {
            fetchMock.mockResolvedValueOnce(Response.json(body));

            const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

            expect(result).toEqual({ error: expect.any(TokenInfoInvalidResponseError), kind: 'unavailable' });
        });
    });

    describe('a failed request', () => {
        it.each([429, 500])('should answer unavailable with the status of a %i', async status => {
            fetchMock.mockResolvedValueOnce(Response.json({ error: 'nope' }, { status }));

            const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

            expect(result).toEqual({ error: expect.any(TokenInfoHttpError), kind: 'unavailable' });
            expect(result.kind === 'unavailable' && result.error).toMatchObject({ status });
        });

        it('should answer unavailable with the error of a network failure', async () => {
            const error = new TypeError('fetch failed');
            fetchMock.mockRejectedValueOnce(error);

            const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

            expect(result).toEqual({ error, kind: 'unavailable' });
        });

        it('should answer unavailable with the abort reason of an aborted signal', async () => {
            const controller = new AbortController();
            controller.abort();
            fetchMock.mockImplementationOnce((_: string, init: RequestInit) => Promise.reject(init.signal?.reason));

            const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY, signal: controller.signal });

            expect(result).toEqual({ error: controller.signal.reason, kind: 'unavailable' });
        });
    });
});
