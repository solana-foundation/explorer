import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';

import { jupiterToken } from '../../__fixtures__/jupiter-token';
import { JupiterHttpError } from '../../lib/errors';
import { fetchJupiterVerifiedTokens, searchJupiterTokens } from '../fetch-jupiter-tokens';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);
const MINT_C = gen.address(3);

const API_KEY = 'test-key';
const QUERY = 'wrapped sol, usd & co';

const fetchMock = vi.fn<typeof fetch>();

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

        await search();

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.jup.ag/tokens/v2/search?query=wrapped%20sol%2C%20usd%20%26%20co');
        expect(init?.headers).toEqual({ Accept: 'application/json', 'x-api-key': API_KEY });
    });

    it('should return the tokens, including one with a null isVerified and website', async () => {
        const tokens = [jupiterToken(MINT_A), jupiterToken(MINT_B, { isVerified: null, website: null })];
        fetchMock.mockResolvedValueOnce(Response.json(tokens));

        expect(await search()).toEqual({ kind: 'resolved', tokens });
    });

    it.each([
        ['a body that is not an array', { content: [] }, []],
        [
            'an array with one malformed entry',
            [jupiterToken(MINT_A), { id: MINT_B }, jupiterToken(MINT_C)],
            [1, 'name'],
        ],
        [
            'an entry whose isVerified is a string',
            [jupiterToken(MINT_A), jupiterToken(MINT_B, { isVerified: 'true' })],
            [1, 'isVerified'],
        ],
    ])('should return unavailable with the path that breaks the schema for %s', async (_, body, path) => {
        fetchMock.mockResolvedValueOnce(Response.json(body));

        expect(await search()).toEqual({ error: expect.objectContaining({ path }), kind: 'unavailable' });
    });

    it('should return rate-limited for a 429', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

        expect(await search()).toEqual({ kind: 'rate-limited' });
    });

    it('should return unavailable with the status of a failed response', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

        expect(await search()).toEqual({
            error: new JupiterHttpError({ status: 503, statusText: '' }),
            kind: 'unavailable',
        });
    });

    it('should return unavailable with the error of a network failure', async () => {
        const error = new TypeError('fetch failed');
        fetchMock.mockRejectedValueOnce(error);

        expect(await search()).toEqual({ error, kind: 'unavailable' });
    });
});

describe('fetchJupiterVerifiedTokens', () => {
    it('should request the verified tag with the API key, outside the Next data cache', async () => {
        const tokens = [jupiterToken(MINT_A)];
        fetchMock.mockResolvedValueOnce(Response.json(tokens));
        const signal = new AbortController().signal;

        const result = await fetchJupiterVerifiedTokens({ apiKey: API_KEY, signal });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.jup.ag/tokens/v2/tag?query=verified');
        expect(init).toMatchObject({ cache: 'no-store', headers: { 'x-api-key': API_KEY }, signal });
        expect(result).toEqual({ kind: 'resolved', tokens });
    });
});

function search(): ReturnType<typeof searchJupiterTokens> {
    return searchJupiterTokens({ apiKey: API_KEY, query: QUERY });
}
