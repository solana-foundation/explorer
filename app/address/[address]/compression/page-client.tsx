'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { CompressedNFTInfoCard } from '@/app/components/account/CompressedNFTInfoCard';
import { ErrorCard } from '@/app/components/common/ErrorCard';
import { LoadingCard } from '@/app/components/common/LoadingCard';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function CompressionCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    return (
        <ErrorBoundary
            fallbackRender={({ error }) => (
                <ErrorCard text={`Failed to load compression information: ${error.message}`} />
            )}
        >
            <Suspense fallback={<LoadingCard />}>
                {<CompressedNFTInfoCard account={account} onNotFound={onNotFound} />}
            </Suspense>
        </ErrorBoundary>
    );
}

export default function CompressionPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={CompressionCardRenderer} />;
}
