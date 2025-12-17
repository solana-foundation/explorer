'use client';

import { LoadingCard } from '@components/common/LoadingCard';
import { IdlCard } from '@features/idl';
import { Suspense } from 'react';

import { PageRenderer } from './page-renderer';

export default function IdlPageClient({ address }: Readonly<{ address: string }>) {
    return <PageRenderer address={address} renderComponent={IdlRenderComponent} />;
}

function IdlRenderComponent({ address }: { address: string }) {
    return (
        <Suspense fallback={<LoadingCard message="Loading program IDL" />}>
            <IdlCard programId={address} />
        </Suspense>
    );
}
