'use client';

import React, { Suspense } from 'react';

import { LoadingCard } from '@/app/components/common/LoadingCard';
import { WalletSubscriptionsCard } from '@/app/features/subscriptions';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function SubscriptionsPageClient({ params: { address } }: Props) {
    return (
        <Suspense fallback={<LoadingCard />}>
            <WalletSubscriptionsCard address={address} />
        </Suspense>
    );
}
