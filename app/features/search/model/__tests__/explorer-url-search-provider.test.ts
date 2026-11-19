import { DEFAULT_ADDRESS } from '@__fixtures__/gen';
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
        const results = explorerUrlSearchProvider.search(`https://solscan.io/account/${DEFAULT_ADDRESS}`, ctx);
        expect(results).toEqual([
            {
                label: 'External Explorer',
                options: [
                    {
                        cluster: Cluster.Mainnet,
                        label: 'solscan.io — Account',
                        pathname: `/address/${DEFAULT_ADDRESS}`,
                        type: 'address',
                        value: [`https://solscan.io/account/${DEFAULT_ADDRESS}`],
                    },
                ],
            },
        ]);
    });

    it('should carry the resolved cluster from the external URL', () => {
        const results = explorerUrlSearchProvider.search(
            `https://solscan.io/account/${DEFAULT_ADDRESS}?cluster=devnet`,
            ctx,
        );
        expect(results).toEqual([
            {
                label: 'External Explorer',
                options: [
                    {
                        cluster: Cluster.Devnet,
                        label: 'solscan.io — Account',
                        pathname: `/address/${DEFAULT_ADDRESS}`,
                        type: 'address',
                        value: [`https://solscan.io/account/${DEFAULT_ADDRESS}?cluster=devnet`],
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
