'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorCard } from '@/app/components/common/ErrorCard';
import { LoadingCard } from '@/app/components/common/LoadingCard';
import { WalletSubscriptionsCard } from '@/app/features/subscriptions';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function SubscriptionsPageClient({ params: { address } }: Props) {
    return (
        <ErrorBoundary fallback={<ErrorCard text="Failed to load subscriptions." />}>
            <Suspense fallback={<LoadingCard />}>
                <WalletSubscriptionsCard address={address} />
            </Suspense>
        </ErrorBoundary>
    );
}
