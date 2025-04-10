'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { create } from 'superstruct';

import { TokenExtensionsCard } from '@/app/components/account/TokenExtensionsCard';
import { MintAccountInfo, TokenAccountInfo } from '@/app/validators/accounts/token';

export type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function NoResults() {
    return <div className="card text-center p-4">Can not fetch extensions.</div>;
}

function TokenExtensionsEntriesRenderer({
    account,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data.parsed;

    if (parsedData && parsedData.parsed.type === 'mint') {
        const mintInfo = create(parsedData.parsed.info, MintAccountInfo);
        const address = account.pubkey.toBase58();

        if (!mintInfo.extensions?.length) return <NoResults />;

        return <TokenExtensionsCard address={address} extensions={mintInfo.extensions} />;
    } else if (parsedData && parsedData.parsed.type === 'account') {
        const accountInfo = create(parsedData.parsed.info, TokenAccountInfo);
        const address = accountInfo.mint.toBase58();

        if (!accountInfo.extensions?.length) return <NoResults />;

        return <TokenExtensionsCard address={address} extensions={accountInfo.extensions} />;
    } else {
        // possible cases:
        // - absent parsed data
        // - multisig type of account
        return <NoResults />;
    }
}

export default function TokenExtensionsEntriesPageClient({ params: { address } }: Props) {
    return (
        <ErrorBoundary fallback={<NoResults />}>
            <ParsedAccountRenderer address={address} renderComponent={TokenExtensionsEntriesRenderer} />
        </ErrorBoundary>
    );
}
