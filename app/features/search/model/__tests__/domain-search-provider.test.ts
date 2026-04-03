import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import { domainSearchProvider } from '../domain-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

describe('domainSearchProvider', () => {
    it('should have kind "remote"', () => {
        expect(domainSearchProvider.kind).toBe('remote');
    });

    it('should return domain owner and name service account on success', async () => {
        const mockOwner = '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q';
        const mockAddress = '9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b';
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify({ address: mockAddress, owner: mockOwner })),
        );

        const results = await domainSearchProvider.search('toly.sol', ctx);

        expect(results).toEqual([
            {
                label: 'Domain Owner',
                options: [{ label: mockOwner, pathname: `/address/${mockOwner}`, value: ['toly.sol'] }],
            },
            {
                label: 'Name Service Account',
                options: [{ label: 'toly.sol', pathname: `/address/${mockAddress}`, value: ['toly.sol'] }],
            },
        ]);

        vi.restoreAllMocks();
    });

    it('should return empty for non-mainnet clusters', async () => {
        const devnetCtx = createSearchContext({ cluster: Cluster.Devnet });
        const results = await domainSearchProvider.search('toly.sol', devnetCtx);
        expect(results).toEqual([]);
    });

    it('should return empty for non-domain input', async () => {
        const results = await domainSearchProvider.search('not-a-domain', ctx);
        expect(results).toEqual([]);
    });

    it('should return empty when API returns null info', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(null)));

        const results = await domainSearchProvider.search('unknown.sol', ctx);
        expect(results).toEqual([]);

        vi.restoreAllMocks();
    });

    it('should return empty when API returns incomplete info', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify({ address: null, owner: null })),
        );

        const results = await domainSearchProvider.search('missing.sol', ctx);
        expect(results).toEqual([]);

        vi.restoreAllMocks();
    });

    it('should return empty when fetch fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

        const results = await domainSearchProvider.search('broken.sol', ctx);
        expect(results).toEqual([]);

        vi.restoreAllMocks();
    });
});
