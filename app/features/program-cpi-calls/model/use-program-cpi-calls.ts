'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { isFeatureEnabled as isProgramCpiCallsFeatureEnabled } from '../index';
import type { PagesPaginationWrapper, ProgramCallData } from './types';

const S_MAX_AGE = 12_000; // 12 seconds in milliseconds
const GC_AGE_MS = 60_000; // 1 min in milliseconds

export interface ProgramCpiCallsParams {
    address: string;
    limit: number;
    offset: number;
}

export interface UseProgramCpiCallsOptions {
    enabled?: boolean;
    queryOptions?: Omit<
        UseQueryOptions<PagesPaginationWrapper<ProgramCallData> | null, Error>,
        'queryKey' | 'queryFn' | 'staleTime'
    >;
    onSuccess?: (data: PagesPaginationWrapper<ProgramCallData>) => void;
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
    const queryKey = ['program-cpi-calls', address, limit, offset];

    const { data: records, ...rest } = useQuery({
        enabled,
        gcTime: GC_AGE_MS,
        queryFn: async () => {
            if (!isProgramCpiCallsFeatureEnabled()) return null;

            // Build URL with query parameters
            const url = new URL(`/api/${address}/program-calls`, 'https://origin');

            url.searchParams.set('limit', limit.toString());
            url.searchParams.set('offset', offset.toString());

            const response = await fetch(`${url.pathname}${url.search}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch program CPI calls: ${response.statusText}`);
            }

            let data: PagesPaginationWrapper<ProgramCallData>;
            try {
                data = await response.json();
            } catch (_e) {
                throw new Error('Could not fetch CPI calls data');
            }

            onSuccess?.(data);

            return data;
        },
        queryKey,
        staleTime: S_MAX_AGE,
        ...queryOptions,
    });

    if (!records) return { data: undefined, ...rest };

    return { data: records.data, pagination: records.pagination, ...rest };
}
