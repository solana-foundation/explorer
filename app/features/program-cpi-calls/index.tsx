import { QueryClientProvider } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryClient } from './model/query-client';
import { usePagination } from './model/use-pagiantion';
import { ProgramCpiCallsView } from './ui/ProgramCpiCallsView';

export function ProgramCpiCalls({ address }: { address: string }) {
    return (
        <QueryClientProvider client={queryClient}>
            <BaseProgramCpiCalls address={address} />
        </QueryClientProvider>
    );
}

function BaseProgramCpiCalls({ address }: { address: string }) {
    const pagination = usePagination();

    const handleLoadNextPage = useCallback(() => {
        pagination.nextPage();
    }, [pagination]);

    const handleRefresh = useCallback(async () => {
        [];
        pagination.reset();
        await queryClient.invalidateQueries({ queryKey: ['program-cpi-calls', address] });
    }, [address, pagination]);

    return (
        <ProgramCpiCallsView
            address={address}
            foundLatest={!pagination.hasNextPage}
            onLoadNextPage={handleLoadNextPage}
            onRefresh={handleRefresh}
        />
    );
}
