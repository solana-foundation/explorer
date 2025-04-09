'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import React from 'react';

import { TokenExtensionsCard } from '@/app/components/account/TokenExtensionsCard';

export type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function TokenExtensionsEntriesRenderer({ account }: any) {
    //React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data.parsed;
    const rawData = account?.data.raw;
    const address = account?.pubkey.toBase58();
    console.log({ account }, parsedData, rawData);

    if (parsedData.parsed.type === 'mint') return <TokenExtensionsCard address={address} />;
    else if (parsedData.parsed.type === 'account') {
        return <TokenExtensionsCard address={address} />;
    } else {
        return <div className="text-center p-4">No extensions found.</div>;
    }
    return null;
}

export default function TokenExtensionsEntriesPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={TokenExtensionsEntriesRenderer} />;
}
