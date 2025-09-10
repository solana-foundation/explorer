import { QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { isEnvEnabled } from '@/app/utils/env';

import { queryClient } from './model/query-client';
import { usePagination } from './model/use-pagiantion';
import { useTotalProgramCpiCalls } from './model/use-total-program-cpi-calls';
import { ProgramCpiCallsView } from './ui/ProgramCpiCallsView';

export function isFeatureEnabled() {
    return isEnvEnabled(process.env.NEXT_PUBLIC_PROGRAM_CPI_CALLS_ENABLED);
}

export function ProgramCpiCalls({ address }: { address: string }) {
    return (
        <QueryClientProvider client={queryClient}>
            <BaseProgramCpiCalls address={address} />
        </QueryClientProvider>
    );
}

function BaseProgramCpiCalls({ address }: { address: string }) {
    const pagination = usePagination();
    const { data } = useTotalProgramCpiCalls({ address });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleLoadNextPage = useCallback(() => {
        pagination.nextPage();
    }, [pagination]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        pagination.reset();
        await queryClient.invalidateQueries({ queryKey: ['program-cpi-calls', address] });
        setIsRefreshing(false);
    }, [address, pagination, setIsRefreshing]);

    return (
        <ProgramCpiCallsView
            address={address}
            foundLatest={!pagination.hasNextPage}
            isRefreshing={isRefreshing}
            onLoadNextPage={handleLoadNextPage}
            onRefresh={handleRefresh}
            total={data?.total}
        />
    );
}
