'use client';

import { useDebouncedValue } from '@mantine/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

import { searchAnalytics } from '@/app/shared/lib/analytics';

import type { SearchItem } from '../lib/types';
import { useSearch } from '../model/use-search';
import { useSearchNavigation } from '../model/use-search-navigation';
import { BaseSearch } from './BaseSearch';

export const SEARCH_DEBOUNCE_MS = 500;

export function SearchBar() {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

    const { data: results = [], isLoading: isFetching } = useSearch(debouncedSearch);
    const isSearchPending = search.trim().length > 0 && search !== debouncedSearch;
    const isLoading = isFetching || isSearchPending;
    const navigate = useSearchNavigation();

    const prevIsLoadingRef = useRef(false);
    useEffect(() => {
        const wasLoading = prevIsLoadingRef.current;
        prevIsLoadingRef.current = isLoading;

        if (wasLoading && !isLoading && debouncedSearch.trim()) {
            const totalResults = results.reduce((sum, group) => sum + group.options.length, 0);
            searchAnalytics.trackPerformed(debouncedSearch.trim().length, totalResults);
        }
    }, [isLoading, debouncedSearch, results]);

    const handleSelect = useCallback(
        (option: SearchItem) => {
            const resultType = option.pathname.split('/')[1] ?? 'unknown';
            searchAnalytics.trackResultSelected(resultType, option.verified ?? false);
            navigate(option);
            setSearch('');
            setOpen(false);
        },
        [navigate],
    );

    return (
        <BaseSearch
            value={search}
            open={open}
            results={results}
            isLoading={isLoading}
            onValueChange={setSearch}
            onOpenChange={setOpen}
            onSelect={handleSelect}
        />
    );
}

export default SearchBar;
