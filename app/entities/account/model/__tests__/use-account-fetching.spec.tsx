import { type CacheEntry, FetchStatus } from '@providers/cache';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAccountFetching } from '../use-account-fetching';

const mock = vi.hoisted(() => ({ entry: undefined as CacheEntry<object> | undefined }));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: (address: string | undefined) => (address === ADDRESS ? mock.entry : undefined),
}));

describe('useAccountFetching', () => {
    it.each([
        [true, 'fetching without data', { status: FetchStatus.Fetching }],
        [true, 'fetching with data', { data: {}, status: FetchStatus.Fetching }],
        [false, 'fetched', { data: {}, status: FetchStatus.Fetched }],
        [false, 'failed', { status: FetchStatus.FetchFailed }],
    ])('should return %s for an account that is %s', (expected, _, entry) => {
        mock.entry = entry;

        expect(renderHook(() => useAccountFetching(ADDRESS)).result.current).toBe(expected);
    });

    it.each([
        ['an address without a cache entry', 'Other1111111111111111111111111111111111111'],
        ['no address', undefined],
    ])('should return false for %s', (_, address) => {
        mock.entry = { status: FetchStatus.Fetching };

        expect(renderHook(() => useAccountFetching(address)).result.current).toBe(false);
    });
});

const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
