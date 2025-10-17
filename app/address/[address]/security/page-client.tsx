'use client';

import { captureException } from '@sentry/nextjs';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ParsedAccountRenderer } from '@/app/components/account/ParsedAccountRenderer';
import { ErrorCard } from '@/app/components/common/ErrorCard';
import { SecurityCard } from '@/app/features/security-txt/ui/SecurityCard';

const isSentryEnabled = process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS === '1';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function SecurityCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data?.parsed;
    if (!parsedData || parsedData?.program !== 'bpf-upgradeable-loader') {
        return onNotFound();
    }
    return <SecurityCard data={parsedData} pubkey={account.pubkey} />;
}

export default function SecurityPageClient({ params: { address } }: Props) {
    return (
        <ErrorBoundary
            onError={(error: Error) => {
                if (isSentryEnabled) {
                    captureException(error);
                }
            }}
            fallbackRender={({ error }) => <ErrorCard text={`Failed to load security data: ${error.message}`} />}
        >
            <ParsedAccountRenderer address={address} renderComponent={SecurityCardRenderer} />
        </ErrorBoundary>
    );
}
