import { useEffect, useRef } from 'react';

import { searchAnalytics } from '@/app/shared/lib/analytics';

import type { SearchOptions } from '../lib/types';

export function useSearchAnalytics(query: string, isLoading: boolean, results: SearchOptions[]): void {
    const prevIsLoadingRef = useRef(false);

    useEffect(() => {
        const wasLoading = prevIsLoadingRef.current;
        prevIsLoadingRef.current = isLoading;

        if (wasLoading && !isLoading && query.trim()) {
            const totalResults = results.reduce((sum, group) => sum + group.options.length, 0);
            searchAnalytics.trackPerformed(query.trim().length, totalResults);
        }
    }, [isLoading, query, results]);
}
