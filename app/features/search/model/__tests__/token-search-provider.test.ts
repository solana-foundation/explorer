import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import { tokenSearchProvider } from '../token-search-provider';
import { createSearchContext } from './provider-test-utils';

vi.mock('../../api/token-search', () => ({
    searchTokens: vi.fn(),
}));

import { searchTokens } from '../../api/token-search';

const ctx = createSearchContext();

describe('tokenSearchProvider', () => {
    it('should have kind "remote"', () => {
        expect(tokenSearchProvider.kind).toBe('remote');
    });

    it('should return matched tokens from the search API', async () => {
        const mockTokens = [
            { label: 'USD Coin', pathname: '/address/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', value: ['USDC'] },
        ];
        vi.mocked(searchTokens).mockResolvedValueOnce(mockTokens);

        const results = await tokenSearchProvider.search('USDC', ctx);

        expect(searchTokens).toHaveBeenCalledWith('USDC', Cluster.MainnetBeta);
        expect(results).toEqual([
            {
                label: 'Tokens',
                options: mockTokens,
            },
        ]);
    });

    it('should return empty when no tokens match', async () => {
        vi.mocked(searchTokens).mockResolvedValueOnce([]);

        const results = await tokenSearchProvider.search('xyznonexistent', ctx);
        expect(results).toEqual([]);
    });
});
