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

    it('should answer the valid entries and the malformed count', async () => {
        fetchMock.mockResolvedValueOnce(Response.json([jupiterToken(MINT_A), { id: MINT_B }, jupiterToken(MINT_C)]));

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({
            kind: 'resolved',
            malformed: 1,
            tokens: [jupiterToken(MINT_A), jupiterToken(MINT_C)],
        });
    });

    it('should answer unavailable for a body that is not an array', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({ content: [] }));

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({ error: expect.any(TokenInfoInvalidResponseError), kind: 'unavailable' });
    });

    it('should answer unavailable with the status of a failed response', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({ error: 'nope' }, { status: 429 }));

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({ error: expect.any(TokenInfoHttpError), kind: 'unavailable' });
        expect(result.kind === 'unavailable' && result.error).toMatchObject({ status: 429 });
    });

    it('should answer unavailable with the error of a network failure', async () => {
        const error = new TypeError('fetch failed');
        fetchMock.mockRejectedValueOnce(error);

        const result = await searchJupiterTokens({ apiKey: API_KEY, query: QUERY });

        expect(result).toEqual({ error, kind: 'unavailable' });
    });
});
