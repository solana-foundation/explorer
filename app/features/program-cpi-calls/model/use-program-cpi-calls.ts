'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

const REFETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
const INITIAL_LIMIT = 50;
const INITIAL_OFFSET = 0;

export interface ProgramCallData {
    address: string;
    calls_number: number;
    createdAt: string;
    description: string | 'None';
    name: string | 'None';
    program_address: string;
}

export interface ProgramCpiCallsParams {
    address: string;
    limit?: number;
    offset?: number;
}

export interface UseProgramCpiCallsOptions {
    enabled?: boolean;
    queryOptions?: Omit<UseQueryOptions<ProgramCallData[], Error>, 'queryKey' | 'queryFn' | 'staleTime'>;
}

/**
 * Hook to fetch CPI program calls for a specific program address
 *
 * @param params - Parameters for the API request
 * @param options - Additional options for the query
 * @returns Query result with program CPI calls data
 */
export function useProgramCpiCalls(params: ProgramCpiCallsParams, options: UseProgramCpiCallsOptions = {}) {
    const { address, limit = INITIAL_LIMIT, offset = INITIAL_OFFSET } = params;
    const { enabled = true, queryOptions = {} } = options;
    const queryKey = ['program-cpi-calls', address, limit, offset];

    return useQuery<ProgramCallData[], Error>({
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

            return response.json();
        },
        queryKey,
        staleTime: REFETCH_INTERVAL_MS,
        ...queryOptions,
    });
}
