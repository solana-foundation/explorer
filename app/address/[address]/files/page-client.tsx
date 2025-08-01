'use client';

import { MetaplexFilesCard } from '@components/account/MetaplexFilesCard';
import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import React, { Suspense } from 'react';

import { LoadingCard } from '@/app/components/common/LoadingCard';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function MetaplexFilesCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    return (
        <Suspense fallback={<LoadingCard />}>
            {<MetaplexFilesCard account={account} onNotFound={onNotFound} />}
        </Suspense>
    );
}

export default function MetaplexFilesPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={MetaplexFilesCardRenderer} />;
}
