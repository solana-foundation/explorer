'use client';

import React, { createContext, useContext } from 'react';

import { contains } from '../model/search';

type SearchHighlightContextValue = {
    searchStr: string;
    contains: (text: string, searchTerm: string) => boolean;
};

const SearchHighlightContext = createContext<SearchHighlightContextValue | null>(null);

export function useSearchHighlight() {
    return useContext(SearchHighlightContext);
}

export function SearchHighlightProvider({
    children,
    searchStr = '',
}: {
    children: React.ReactNode;
    searchStr?: string;
}) {
    return (
        <SearchHighlightContext.Provider value={{ contains, searchStr: (searchStr || '').trim() }}>
            {children}
        </SearchHighlightContext.Provider>
    );
}
