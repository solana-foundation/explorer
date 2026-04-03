import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import type { SearchProvider } from '../../lib/types';
import { featureGateSearchProvider } from '../feature-gate-search-provider';
import { loaderSearchProvider } from '../loader-search-provider';
import { programSearchProvider } from '../program-search-provider';
import { specialSearchProvider } from '../special-search-provider';
import { sysvarSearchProvider } from '../sysvar-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

// These providers all follow the same pattern: match a query against a static
// registry and return a single labelled group. Testing them together avoids
// five near-identical test files.
const lookupProviders: [SearchProvider, string, string][] = [
    [featureGateSearchProvider, 'transaction', 'Feature Gates'],
    [loaderSearchProvider, 'BPF', 'Program Loaders'],
    [specialSearchProvider, 'Incinerator', 'Accounts'],
    [sysvarSearchProvider, 'Clock', 'Sysvars'],
    [programSearchProvider, 'Token', 'Programs'],
];

describe.each(lookupProviders)('$name search provider', (provider, matchQuery, groupLabel) => {
    it(`should have kind "${provider.kind}"`, () => {
        expect(['local', 'fallback', 'remote']).toContain(provider.kind);
    });

    it('should return results for matching input', async () => {
        const results = await provider.search(matchQuery, ctx);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].label).toBe(groupLabel);
    });

    it('should return empty for non-matching input', async () => {
        expect(await provider.search('xyznonexistent123456', ctx)).toEqual([]);
    });
});

describe.each(lookupProviders)('$name minimum query length', provider => {
    it('should return empty for a single-character query', async () => {
        expect(await provider.search('a', ctx)).toEqual([]);
    });

    it('should return empty for an empty query', async () => {
        expect(await provider.search('', ctx)).toEqual([]);
    });
});

describe('programSearchProvider (cluster filtering)', () => {
    it('should return results for both mainnet and devnet', async () => {
        const devnetCtx = createSearchContext({ cluster: Cluster.Devnet });
        expect((await programSearchProvider.search('Token', ctx)).length).toBeGreaterThan(0);
        expect((await programSearchProvider.search('Token', devnetCtx)).length).toBeGreaterThan(0);
    });
});
