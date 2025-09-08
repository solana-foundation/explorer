'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';

import { programCpiCallsAtom } from './state';

const REFETCH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

export interface ProgramCallData {
    address: string;
    calls_number: number;
    createdAt: string;
    description: string | 'None';
    name: string | 'None';
    program_address: string;
}

export interface PagesPaginationWrappper<T extends ProgramCallData> {
    data: Array<T>;
    pagination: { limit: number; offset: number; totalPages: number };
}

export interface ProgramCpiCallsParams {
    address: string;
    limit: number;
    offset: number;
}

export interface UseProgramCpiCallsOptions {
    enabled?: boolean;
    queryOptions?: Omit<
        UseQueryOptions<PagesPaginationWrappper<ProgramCallData>, Error>,
        'queryKey' | 'queryFn' | 'staleTime'
    >;
    onSuccess?: (data: PagesPaginationWrappper<ProgramCallData>) => void;
}

/**
 * Hook to fetch CPI program calls for a specific program address
 *
 * @param params - Parameters for the API request
 * @param options - Additional options for the query
 * @returns Query result with program CPI calls data
 */
export function useProgramCpiCalls(params: ProgramCpiCallsParams, options: UseProgramCpiCallsOptions = {}) {
    const { address, limit, offset } = params;
    const { enabled = true, queryOptions = {}, onSuccess } = options;
    const setRecords = useSetAtom(programCpiCallsAtom);
    const queryKey = ['program-cpi-calls', address, limit, offset];

    const { data: records, ...rest } = useQuery({
        enabled,
        queryFn: async () => {
            // Build URL with query parameters
            const url = new URL(`/api/${address}/program-calls`, 'https://origin');

            url.searchParams.set('limit', limit.toString());
            url.searchParams.set('offset', offset.toString());

            const response = await fetch(`${url.pathname}${url.search}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch program CPI calls: ${response.statusText}`);
            }

            let data: PagesPaginationWrappper<ProgramCallData>;
            try {
                data = await response.json();
            } catch (_e) {
                throw new Error('Could not fetch CPI calls data');
            }

            setRecords(prev => {
                // If offset is 0, we're starting fresh (either initial load or refresh)
                // Otherwise, we're paginating and should append
                if (offset === 0) {
                    return data.data;
                }
                return [...prev, ...data.data];
            });

            onSuccess?.(data);

            return data;
        },
        queryKey,
        staleTime: REFETCH_INTERVAL_MS,
        ...queryOptions,
    });

    if (!records) return { data: undefined, ...rest };

    return { data: records.data, pagination: records.pagination, ...rest };
}
