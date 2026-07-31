import { describe, expect, it } from 'vitest';

import { buildRpcFilters, hasActiveFilters } from '../history-filters';

describe('buildRpcFilters', () => {
    it('should omit the filters object entirely when nothing is set', () => {
        expect(buildRpcFilters({})).toBeUndefined();
    });

    it('should drop ranges whose bounds are all undefined, so the RPC never sees `{ slot: {} }`', () => {
        expect(buildRpcFilters({ blockTime: {}, slot: { gte: undefined, lte: undefined } })).toBeUndefined();
    });

    it('should keep only the bounds that are set', () => {
        expect(buildRpcFilters({ slot: { gte: 100, lte: undefined } })).toEqual({ slot: { gte: 100 } });
    });

    it('should pass slot, block time and status through under the RPC field names', () => {
        expect(
            buildRpcFilters({
                blockTime: { lte: 1_700_100_000 },
                slot: { gte: 100, lte: 500 },
                status: 'failed',
            }),
        ).toEqual({
            blockTime: { lte: 1_700_100_000 },
            slot: { gte: 100, lte: 500 },
            status: 'failed',
        });
    });

    it('should treat a zero bound as set rather than falsy', () => {
        expect(buildRpcFilters({ slot: { gte: 0 } })).toEqual({ slot: { gte: 0 } });
    });
});

describe('hasActiveFilters', () => {
    it('should report no active filters for an empty or hollow filter object', () => {
        expect(hasActiveFilters({})).toBe(false);
        expect(hasActiveFilters({ blockTime: {}, slot: {} })).toBe(false);
    });

    it('should report an active filter when any bound or status is set', () => {
        expect(hasActiveFilters({ slot: { gte: 1 } })).toBe(true);
        expect(hasActiveFilters({ status: 'succeeded' })).toBe(true);
    });
});
