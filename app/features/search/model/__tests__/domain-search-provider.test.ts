import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import { domainSearchProvider } from '../domain-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

describe('domainSearchProvider', () => {
    it('should have kind "remote"', () => {
        expect(domainSearchProvider.kind).toBe('remote');
    });

    it('should return domain owner with domain as label on success', async () => {
        const mockOwner = '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q';
        const mockAddress = '9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b';
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify({ address: mockAddress, owner: mockOwner })),
        );

        const results = await domainSearchProvider.search('toly.sns', ctx);

        expect(results).toEqual([
            {
                label: 'Domain Owners',
                options: [
                    {
                        label: 'toly.sns',
                        pathname: `/address/${mockOwner}`,
                        sublabel: mockOwner,
                        type: 'address',
                        value: ['toly.sns', mockOwner],
                    },
                ],
            },
        ]);

        vi.restoreAllMocks();
    });

    it('should normalize mixed-case input to lowercase in the result', async () => {
        const mockOwner = '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q';
        const mockAddress = '9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b';
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify({ address: mockAddress, owner: mockOwner })),
        );

        const results = await domainSearchProvider.search('TOLY.sns', ctx);

        expect(results[0].options[0].label).toBe('toly.sns');
        expect(results[0].options[0].value).toEqual(['toly.sns', mockOwner]);

        vi.restoreAllMocks();
    });

    it('should accept all-caps domain (.SNS suffix) and normalize the result to lowercase', async () => {
        const mockOwner = '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q';
        const mockAddress = '9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b';
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify({ address: mockAddress, owner: mockOwner })),
        );

        const results = await domainSearchProvider.search('TOLY.SNS', ctx);

        expect(results).toHaveLength(1);
        expect(results[0].options[0].label).toBe('toly.sns');
        expect(results[0].options[0].value).toEqual(['toly.sns', mockOwner]);

        vi.restoreAllMocks();
    });

    it('should return empty for non-mainnet clusters', async () => {
        const devnetCtx = createSearchContext({ cluster: Cluster.Devnet });
        const results = await domainSearchProvider.search('toly.sns', devnetCtx);
        expect(results).toEqual([]);
    });

    it('should return empty for non-domain input', async () => {
        const results = await domainSearchProvider.search('not-a-domain', ctx);
        expect(results).toEqual([]);
    });

    it('should return empty when API returns null info', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(null)));

        const results = await domainSearchProvider.search('unknown.sns', ctx);
        expect(results).toEqual([]);

        vi.restoreAllMocks();
    });

    it('should return empty when API returns incomplete info', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify({ address: null, owner: null })),
        );

        const results = await domainSearchProvider.search('missing.sns', ctx);
        expect(results).toEqual([]);

        vi.restoreAllMocks();
    });

    it.each([
        ['owner', { address: '9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b', owner: 'not-an-address' }],
        ['address', { address: 'not-an-address', owner: '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q' }],
    ])('should return empty when the API returns a malformed %s', async (_field, body) => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(body)));

        const results = await domainSearchProvider.search('toly.sns', ctx);
        expect(results).toEqual([]);

        vi.restoreAllMocks();
    });

    it('should return empty when fetch fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

        const results = await domainSearchProvider.search('broken.sns', ctx);
        expect(results).toEqual([]);

        vi.restoreAllMocks();
    });
});
