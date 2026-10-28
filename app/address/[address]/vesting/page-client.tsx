'use client';

import { ErrorBoundary } from 'react-error-boundary';

import { ErrorCard } from '@/app/components/common/ErrorCard';
import { TokenVestingCard } from '@/app/features/genesis-vesting';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function VestingPageClient({ params: { address } }: Props) {
    return (
        // Fetch errors are handled in the card, with a retry; this boundary only catches rendering errors.
        <ErrorBoundary fallback={<ErrorCard text="Failed to display vesting locks." />}>
            <TokenVestingCard mint={address} />
        </ErrorBoundary>
    );
}
