'use client';

import { LoadingCard } from '@components/common/LoadingCard';
import { Suspense } from 'react';

import { ErrorCard } from '@/app/components/common/ErrorCard';
import { withSentry } from '@/app/entities/error-boundary/ui/ErrorBoundary';

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
    return (
        <Suspense fallback={<LoadingCard message="Loading program CPI calls" />}>
            <div>program cpi calls {address}</div>
        </Suspense>
    );
}
