import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { explorerUrlSearchProvider } from '../explorer-url-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

describe('explorerUrlSearchProvider', () => {
    it('should have kind "local"', () => {
        expect(explorerUrlSearchProvider.kind).toBe('local');
    });

    it('should return an option for a recognised Solscan URL', () => {
        const results = explorerUrlSearchProvider.search(
            'https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E',
            ctx,
        );
        expect(results).toEqual([
            {
                label: 'External Explorer',
                options: [
                    {
                        cluster: Cluster.MainnetBeta,
                        label: 'solscan.io — Account',
                        pathname: '/address/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E',
                        value: ['https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E'],
                    },
                ],
            },
        ]);
    });

    it('should carry the resolved cluster from the external URL', () => {
        const results = explorerUrlSearchProvider.search('https://solscan.io/account/abc?cluster=devnet', ctx);
        expect(results).toEqual([
            {
                label: 'External Explorer',
                options: [
                    {
                        cluster: Cluster.Devnet,
                        label: 'solscan.io — Account',
                        pathname: '/address/abc',
                        value: ['https://solscan.io/account/abc?cluster=devnet'],
                    },
                ],
            },
        ]);
    });

    it('should return empty array for non-URL input', () => {
        expect(explorerUrlSearchProvider.search('hello', ctx)).toEqual([]);
    });

    it('should return empty array for unrecognised URLs', () => {
        expect(explorerUrlSearchProvider.search('https://example.com/foo', ctx)).toEqual([]);
    });
});
