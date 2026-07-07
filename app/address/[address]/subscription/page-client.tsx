'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import React, { Suspense } from 'react';

import { LoadingCard } from '@/app/components/common/LoadingCard';
import { SubscriptionsAccountCard } from '@/app/features/subscriptions';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function SubscriptionCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    return (
        <Suspense fallback={<LoadingCard />}>
            <SubscriptionsAccountCard account={account} onNotFound={onNotFound} />
        </Suspense>
    );
}

export default function SubscriptionPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={SubscriptionCardRenderer} />;
}
