'use client';

import { useDebouncedValue } from '@mantine/hooks';
import { useCallback, useState } from 'react';

import type { SearchItem } from '../lib/types';
import { useSearch } from '../model/use-search';
import { useSearchNavigation } from '../model/use-search-navigation';
import { BaseSearch } from './BaseSearch';

const SEARCH_DEBOUNCE_MS = 500;

export function SearchBar() {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

    const { data: results = [], isLoading } = useSearch(debouncedSearch);
    const navigate = useSearchNavigation();

    const handleSelect = useCallback(
        (option: SearchItem) => {
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
