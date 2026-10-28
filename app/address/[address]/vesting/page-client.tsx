'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorCard } from '@/app/components/common/ErrorCard';
import { LoadingCard } from '@/app/components/common/LoadingCard';
import { TokenVestingCard } from '@/app/features/genesis-vesting';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function VestingPageClient({ params: { address } }: Props) {
    return (
        <ErrorBoundary fallback={<ErrorCard text="Failed to load vesting locks." />}>
            <Suspense fallback={<LoadingCard />}>
                <TokenVestingCard mint={address} />
            </Suspense>
        </ErrorBoundary>
    );
}
