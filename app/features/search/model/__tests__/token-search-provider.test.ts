import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tokenSearchProvider } from '../token-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

const TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';

function makeApiResponse(tokens: object[] = [makeToken()]) {
    return new Response(
        JSON.stringify({
            meta: { total: tokens.length },
            query: 'sol',
            queryType: 'text',
            results: { tokens },
            success: true,
        }),
    );
}

function makeToken(overrides: Record<string, unknown> = {}) {
    return {
        decimals: 9,
        icon: 'https://example.com/sol.png',
        isVerified: true,
        name: 'Wrapped SOL',
        ticker: 'SOL',
        tokenAddress: TOKEN_ADDRESS,
        ...overrides,
    };
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('tokenSearchProvider', () => {
    it('should have kind "remote"', () => {
        expect(tokenSearchProvider.kind).toBe('remote');
    });

    it('should return [] for empty query', async () => {
        const result = await tokenSearchProvider.search('', ctx);
        expect(result).toEqual([]);
    });

    it('should return [] for whitespace-only query', async () => {
        const result = await tokenSearchProvider.search('   ', ctx);
        expect(result).toEqual([]);
    });

    it('should return a Tokens section on success', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeApiResponse());

        const result = await tokenSearchProvider.search('sol', ctx);

        expect(result).toEqual([
            {
                label: 'Tokens',
                options: [
                    {
                        icon: 'https://example.com/sol.png',
                        label: 'SOL - Wrapped SOL',
                        pathname: '/address/' + TOKEN_ADDRESS,
                        sublabel: TOKEN_ADDRESS,
                        type: 'address',
                        value: ['Wrapped SOL', 'SOL', TOKEN_ADDRESS],
                        verified: true,
                    },
                ],
            },
        ]);
    });

    it('should return [] when the token list is empty', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeApiResponse([]));

        const result = await tokenSearchProvider.search('sol', ctx);
        expect(result).toEqual([]);
    });

    it('should return [] when fetch throws', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

        const result = await tokenSearchProvider.search('sol', ctx);
        expect(result).toEqual([]);
    });

    it('should return [] when response is not ok', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

        const result = await tokenSearchProvider.search('sol', ctx);
        expect(result).toEqual([]);
    });

    it('should return [] when response shape is invalid', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ unexpected: true })));

        const result = await tokenSearchProvider.search('sol', ctx);
        expect(result).toEqual([]);
    });

    it('should set icon to undefined when token has no icon', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeApiResponse([makeToken({ icon: null })]));

        const result = await tokenSearchProvider.search('sol', ctx);
        expect(result[0].options[0].icon).toBeUndefined();
    });
});
