import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { searchAnalytics } from '@/app/shared/lib/analytics';

import type { SearchOptions } from '../../lib/types';
import { useSearchAnalytics } from '../use-search-analytics';

vi.mock('@/app/shared/lib/analytics', () => ({
    searchAnalytics: {
        trackPerformed: vi.fn(),
    },
}));

const results: SearchOptions[] = [
    {
        label: 'Tokens',
        options: [
            { label: 'A', pathname: '/a', value: ['a'] },
            { label: 'B', pathname: '/b', value: ['b'] },
        ],
    },
];

describe('useSearchAnalytics', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should fire trackPerformed when loading transitions from true to false', () => {
        const { rerender } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useSearchAnalytics('solana', isLoading, results),
            { initialProps: { isLoading: true } },
        );

        expect(searchAnalytics.trackPerformed).not.toHaveBeenCalled();

        rerender({ isLoading: false });

        expect(searchAnalytics.trackPerformed).toHaveBeenCalledOnce();
        expect(searchAnalytics.trackPerformed).toHaveBeenCalledWith(6, 2);
    });

    it('should count total options across all result groups', () => {
        const multiGroupResults: SearchOptions[] = [
            { label: 'Tokens', options: [{ label: 'A', pathname: '/a', value: ['a'] }] },
            {
                label: 'Addresses',
                options: [
                    { label: 'B', pathname: '/b', value: ['b'] },
                    { label: 'C', pathname: '/c', value: ['c'] },
                ],
            },
        ];

        const { rerender } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useSearchAnalytics('sol', isLoading, multiGroupResults),
            { initialProps: { isLoading: true } },
        );

        rerender({ isLoading: false });

        expect(searchAnalytics.trackPerformed).toHaveBeenCalledWith(3, 3);
    });

    it('should not fire when query is empty', () => {
        const { rerender } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useSearchAnalytics('', isLoading, []),
            { initialProps: { isLoading: true } },
        );

        rerender({ isLoading: false });

        expect(searchAnalytics.trackPerformed).not.toHaveBeenCalled();
    });

    it('should not fire when query is whitespace only', () => {
        const { rerender } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useSearchAnalytics('   ', isLoading, []),
            { initialProps: { isLoading: true } },
        );

        rerender({ isLoading: false });

        expect(searchAnalytics.trackPerformed).not.toHaveBeenCalled();
    });

    it('should not fire when already not loading on mount', () => {
        renderHook(() => useSearchAnalytics('solana', false, results));

        expect(searchAnalytics.trackPerformed).not.toHaveBeenCalled();
    });

    it('should not double-fire on re-render with same isLoading=false', () => {
        const { rerender } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useSearchAnalytics('solana', isLoading, results),
            { initialProps: { isLoading: true } },
        );

        rerender({ isLoading: false });
        rerender({ isLoading: false });

        expect(searchAnalytics.trackPerformed).toHaveBeenCalledOnce();
    });

    it('should fire for each distinct search query that completes', () => {
        const { rerender } = renderHook(
            ({ query, isLoading }: { query: string; isLoading: boolean }) =>
                useSearchAnalytics(query, isLoading, results),
            { initialProps: { isLoading: true, query: 'sol' } },
        );

        rerender({ isLoading: false, query: 'sol' });
        rerender({ isLoading: true, query: 'eth' });
        rerender({ isLoading: false, query: 'eth' });

        expect(searchAnalytics.trackPerformed).toHaveBeenCalledTimes(2);
        expect(searchAnalytics.trackPerformed).toHaveBeenNthCalledWith(1, 3, 2);
        expect(searchAnalytics.trackPerformed).toHaveBeenNthCalledWith(2, 3, 2);
    });
});
