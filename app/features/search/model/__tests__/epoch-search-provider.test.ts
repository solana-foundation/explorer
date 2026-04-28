import { describe, expect, it } from 'vitest';

import { epochSearchProvider } from '../epoch-search-provider';
import { createSearchContext } from './provider-test-utils';

describe('epochSearchProvider', () => {
    it('should have kind "local"', () => {
        expect(epochSearchProvider.kind).toBe('local');
    });

    it('should return an epoch option when number is within range', () => {
        const ctx = createSearchContext({ currentEpoch: 500n });
        const results = epochSearchProvider.search('100', ctx);
        expect(results).toEqual([
            {
                label: 'Epochs',
                options: [{ label: 'Epoch #100', pathname: '/epoch/100', type: 'epoch', value: ['100'] }],
            },
        ]);
    });

    it('should return empty when number exceeds currentEpoch + 1', () => {
        const ctx = createSearchContext({ currentEpoch: 50n });
        expect(epochSearchProvider.search('100', ctx)).toEqual([]);
    });

    it('should return empty when currentEpoch is undefined', () => {
        const ctx = createSearchContext();
        expect(epochSearchProvider.search('100', ctx)).toEqual([]);
    });

    it('should return empty for non-numeric input', () => {
        const ctx = createSearchContext({ currentEpoch: 500n });
        expect(epochSearchProvider.search('abc', ctx)).toEqual([]);
    });

    it('should reject hex/binary prefixed numbers', () => {
        const ctx = createSearchContext({ currentEpoch: 500n });
        expect(epochSearchProvider.search('0x10', ctx)).toEqual([]);
    });
});
