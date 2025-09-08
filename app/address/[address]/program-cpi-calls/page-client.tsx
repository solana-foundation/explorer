'use client';

import { LoadingCard } from '@components/common/LoadingCard';
import { Suspense } from 'react';

import { ENABLED_PROGRAMS_FOR_CPI_CALLS } from '@/app/api/shared/constants';
import { ErrorCard } from '@/app/components/common/ErrorCard';
import { withSentry } from '@/app/entities/error-boundary/ui/ErrorBoundary';
import { ProgramCpiCalls } from '@/app/features/program-cpi-calls';

type Params = Readonly<{
    params: {
        address: string;
    };
}>;

export default function ProgramCpiCallsClient({ params: { address } }: Params) {
    return <PageRenderer address={address} />;
}

const PageRenderer = withSentry(ProgramCpiCallsRenderComponent, {
    fallbackRender: ({ error }) => <ErrorCard text={`Failed to load: ${error.message}`} />,
});

function ProgramCpiCallsRenderComponent({ address }: { address: string }) {
    if (!ENABLED_PROGRAMS_FOR_CPI_CALLS.includes(address)) {
        return <ErrorCard text={`There is no data for "${address}" program`} />;
    }

    return (
        <Suspense fallback={<LoadingCard message="Loading program CPI calls" />}>
            <ProgramCpiCalls address={address} />
        </Suspense>
    );
}
