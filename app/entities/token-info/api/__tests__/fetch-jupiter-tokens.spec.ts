import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';

import { jupiterToken } from '../../__fixtures__/jupiter-token';
import { JupiterHttpError } from '../../lib/errors';
import { searchJupiterTokens } from '../fetch-jupiter-tokens';

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
    it('should send the encoded query and the API key to Jupiter', async () => {
        fetchMock.mockResolvedValueOnce(Response.json([]));

        await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.jup.ag/tokens/v2/search?query=wrapped%20sol%2C%20usd%20%26%20co');
        expect(init.headers).toEqual({ Accept: 'application/json', 'x-api-key': API_KEY });
    });

    it('should pass the revalidate value to the Next cache', async () => {
        fetchMock.mockResolvedValueOnce(Response.json([]));

        await searchJupiterTokens({ apiKey: API_KEY, query: QUERY, revalidate: 60 });

        expect(fetchMock.mock.calls[0][1].next).toEqual({ revalidate: 60 });
    });

    it('should pass the abort signal to the request', async () => {
        fetchMock.mockResolvedValueOnce(Response.json([]));
        const signal = new AbortController().signal;

        await searchJupiterTokens({ apiKey: API_KEY, query: QUERY, signal });

        expect(fetchMock.mock.calls[0][1].signal).toBe(signal);
    });

    it('should return the tokens, including one with a null isVerified', async () => {
        const tokens = [jupiterToken(MINT_A), jupiterToken(MINT_B, { isVerified: null })];
        fetchMock.mockResolvedValueOnce(Response.json(tokens));

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({ kind: 'resolved', tokens });
    });

    it.each([
        ['a body that is not an array', { content: [] }, []],
        [
            'an array with one malformed entry',
            [jupiterToken(MINT_A), { id: MINT_B }, jupiterToken(MINT_C)],
            [1, 'name'],
        ],
    ])('should return unavailable with the path that breaks the schema for %s', async (_, body, path) => {
        fetchMock.mockResolvedValueOnce(Response.json(body));

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({ error: expect.objectContaining({ path }), kind: 'unavailable' });
    });

    it('should return rate-limited for a 429 response', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({ error: 'nope' }, { status: 429 }));

        expect(await searchJupiterTokens({ apiKey: API_KEY, query: QUERY })).toEqual({ kind: 'rate-limited' });
    });

    it('should return unavailable with the status of a failed response', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({ error: 'nope' }, { status: 503 }));

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({ error: expect.any(JupiterHttpError), kind: 'unavailable' });
        expect(result.kind === 'unavailable' && result.error).toMatchObject({ status: 503 });
    });

    it('should return unavailable with the error of a network failure', async () => {
        const error = new TypeError('fetch failed');
        fetchMock.mockRejectedValueOnce(error);

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({ error, kind: 'unavailable' });
    });
});
