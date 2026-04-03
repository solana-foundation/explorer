import { searchTokens } from '../api/token-search';
import type { SearchContext, SearchOptions, SearchProvider } from '../lib/types';

/**
 * Remote search provider that looks up tokens by name or symbol.
 *
 * Queries the token registry for matches and returns links to each token's
 * account page. Because the lookup hits an external data source, this
 * provider is marked as `remote` and runs asynchronously.
 *
 * @example
 * // Type a token name or symbol into the search bar:
 * // USDC
 */
export const tokenSearchProvider: SearchProvider = {
    kind: 'remote',
    name: 'token',
    priority: 20,
    async search(query: string, ctx: SearchContext): Promise<SearchOptions[]> {
        const matchedTokens = await searchTokens(query, ctx.cluster);

        if (matchedTokens.length === 0) return [];

        return [
            {
                label: 'Tokens',
                options: matchedTokens,
            },
        ];
    },
};
