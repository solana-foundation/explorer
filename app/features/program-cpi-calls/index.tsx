import { QueryClientProvider } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { queryClient } from './model/query-client';
import { programCpiCallsAtom } from './model/state';
import { usePagination } from './model/use-pagiantion';
import { useProgramCpiCalls } from './model/use-program-cpi-calls';
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
    const records = useAtomValue(programCpiCallsAtom);
    const setRecords = useSetAtom(programCpiCallsAtom);

    const { isLoading, isPending, error, refetch } = useProgramCpiCalls(
        {
            address,
            limit: pagination.limit,
            offset: pagination.offset,
        },
        {
            onSuccess: data => {
                pagination.setTotal(data.pagination.totalPages * data.pagination.limit);
            },
        }
    );

    const handleLoadNextPage = useCallback(() => {
        pagination.nextPage();
    }, [pagination]);

    const handleRefresh = useCallback(async () => {
        setRecords([]);
        pagination.reset();
        await queryClient.invalidateQueries({ queryKey: ['program-cpi-calls', address] });
        refetch();
    }, [address, pagination, refetch, setRecords]);

    return (
        <ProgramCpiCallsView
            address={address}
            error={error}
            records={records}
            isLoading={isLoading}
            isPending={isPending}
            foundLatest={!pagination.hasNextPage}
            onLoadNextPage={handleLoadNextPage}
            onRefresh={handleRefresh}
        />
    );
}
