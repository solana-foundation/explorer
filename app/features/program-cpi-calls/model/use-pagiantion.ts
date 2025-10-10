'use client';

import { useAtom } from 'jotai';
import { useMemo } from 'react';

import { paginationAtom, paginationDefaults } from './state';

export function usePagination() {
    const [pagination, setPagination] = useAtom(paginationAtom);
    const { limit, offset, total } = pagination;

    const hasNextPage = useMemo(() => {
        if (total === null) return true; // Unknown total, assume there's more
        return offset + limit < total;
    }, [offset, limit, total]);

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = total !== null ? Math.ceil(total / limit) : null;

    const nextPage = () => {
        if (hasNextPage) {
            setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
        }
    };

    const reset = () => {
        setPagination(() => ({ ...paginationDefaults }));
    };

    const setTotal = (newTotal: number) => {
        setPagination(prev => ({ ...prev, total: newTotal }));
    };

    return {
        currentPage,
        hasNextPage,
        limit,
        nextPage,
        offset,
        reset,
        setTotal,
        total,
        totalPages,
    };
}
