import { useEffect, useMemo, useState } from 'react';

import { fetchProgramsPage } from './api';
import { VerifiedProgramInfo } from './types';

export function useVerifiedProgramsPagination(searchQuery: string) {
    const [programs, setPrograms] = useState<VerifiedProgramInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [foundLast, setFoundLast] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadFirstPage() {
            try {
                setIsLoading(true);
                const result = await fetchProgramsPage(1);

                if (cancelled) return;

                setPrograms(result.programs);
                setTotalCount(result.totalCount);
                setCurrentPage(2); // Next page to load
                setFoundLast(result.totalPages === 1);
                setIsLoading(false);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error('Failed to load programs'));
                    setIsLoading(false);
                }
            }
        }

        loadFirstPage();

        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (isFetching || foundLast) return;

        try {
            setIsFetching(true);
            const result = await fetchProgramsPage(currentPage);

            setPrograms(prev => [...prev, ...result.programs]);
            setCurrentPage(prev => prev + 1);
            setFoundLast(currentPage >= result.totalPages);
            setIsFetching(false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load more programs'));
            setIsFetching(false);
        }
    };

    const filteredPrograms = useMemo(() => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return programs.filter(
                p => p.name.toLowerCase().includes(query) || p.programId.toLowerCase().includes(query)
            );
        }

        return programs;
    }, [programs, searchQuery]);

    return {
        currentPage,
        error,
        filteredPrograms,
        foundLast,
        isFetching,
        isLoading,
        loadMore,
        programs,
        totalCount,
    };
}
