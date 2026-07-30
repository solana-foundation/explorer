'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import { BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL, isParsedAccountProgram } from '@explorer/parsers';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { VerifiedBuildCard } from '@/app/components/account/VerifiedBuildCard';
import { ErrorCard } from '@/app/components/common/ErrorCard';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function VerifiedBuildCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data?.parsed;
    if (!account || !isParsedAccountProgram(parsedData, BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL)) {
        return onNotFound();
    }
    return (
        <ErrorBoundary fallback={<ErrorCard text="Error loading verified build information" />}>
            <VerifiedBuildCard data={parsedData} pubkey={account.pubkey} />
        </ErrorBoundary>
    );
}

export default function VerifiedBuildPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={VerifiedBuildCardRenderer} />;
}
