'use client';

import React from 'react';

import { ParsedAccountRenderer } from '@/app/components/account/ParsedAccountRenderer';
import { SecurityCard } from '@/app/features/security-txt/ui/SecurityCard';

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
    return <ParsedAccountRenderer address={address} renderComponent={SecurityCardRenderer} />;
}
