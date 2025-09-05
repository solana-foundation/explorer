import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './model/query-client';
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
    const { data, isLoading, error } = useProgramCpiCalls({
        address,
        limit: 20,
        offset: 0,
    });

    console.log({ data, error, isLoading });

    return <ProgramCpiCallsView address={address} />;
}
