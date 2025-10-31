'use client';

import React, { Suspense } from 'react';

import { ParsedAccountRenderer } from '@/app/components/account/ParsedAccountRenderer';
import { LoadingCard } from '@/app/components/common/LoadingCard';
import { MetadataCard } from '@/app/features/metadata';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function MetaplexMetadataCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    if (!account) {
        return onNotFound();
    }
    return <Suspense fallback={<LoadingCard />}>{<MetadataCard account={account} />}</Suspense>;
}

export default function MetaplexNFTMetadataPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={MetaplexMetadataCardRenderer} />;
}
