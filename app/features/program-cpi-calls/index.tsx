import { PublicKey } from '@solana/web3.js';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { useMemo } from 'react';

import { store as paginationStore } from './model/pagination-state';
import { queryClient } from './model/query-client';
import { useProgramCpiCalls } from './model/use-program-cpi-calls';
import { type CpiCallRecord,ProgramCpiCallsView } from './ui/ProgramCpiCallsView';

export function ProgramCpiCalls({ address }: { address: string }) {
    return (
        <QueryClientProvider client={queryClient}>
            <JotaiProvider store={paginationStore}>
                <BaseProgramCpiCalls address={address} />
            </JotaiProvider>
        </QueryClientProvider>
    );
}

function BaseProgramCpiCalls({ address }: { address: string }) {
    const { data, isLoading, error } = useProgramCpiCalls({
        address,
        limit: 20,
        offset: 0,
    });

    console.log({ data, error, isLoading });

    const records = useMemo(() => {
        if (!data) return undefined;
        return data.map<CpiCallRecord>(({ address, calls_number, description, name }) => ({
            address: new PublicKey(address),
            calls: calls_number,
            description,
            name,
        }));
    }, [data]);

    return <ProgramCpiCallsView records={records} isLoading={isLoading} />;
}
