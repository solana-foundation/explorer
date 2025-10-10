'use client';

import { LoadingCard } from '@components/common/LoadingCard';
import { Suspense } from 'react';

import { IdlCard } from '@/app/components/account/idl/IdlCard';
import { ErrorCard } from '@/app/components/common/ErrorCard';
import { withSentry } from '@/app/entities/error-boundary/ui/ErrorBoundary';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function IdlPageClient({ params: { address } }: Props) {
    return <PageRenderer address={address} />;
}

const PageRenderer = withSentry(IdlRenderComponent, {
    fallbackRender: ({ error }) => <ErrorCard text={`Failed to load: ${error.message}`} />,
});

function IdlRenderComponent({ address }: { address: string }) {
    return (
        <Suspense fallback={<LoadingCard message="Loading program IDL" />}>
            <IdlCard programId={address} />
        </Suspense>
    );
}
