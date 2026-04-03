import { describe, expect, it } from 'vitest';

import { blockSearchProvider } from '../block-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

describe('blockSearchProvider', () => {
    it('should have kind "local"', () => {
        expect(blockSearchProvider.kind).toBe('local');
    });

    it('should return a block option for numeric input', () => {
        const results = blockSearchProvider.search('12345', ctx);
        expect(results).toEqual([
            {
                label: 'Block',
                options: [{ label: 'Slot #12345', pathname: '/block/12345', value: ['12345'] }],
            },
        ]);
    });

    it('should return empty array for non-numeric input', () => {
        expect(blockSearchProvider.search('abc', ctx)).toEqual([]);
    });
});
