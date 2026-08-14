'use client';

import { isPmpAccount } from '@entities/pmp-account';
import { PmpAccountCard } from '@features/decode-account-pmp';
import React from 'react';

import { ParsedAccountRenderer } from '@/app/components/account/ParsedAccountRenderer';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function AccountDataCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    if (!account || !isPmpAccount(account)) {
        return onNotFound();
    }

    return <PmpAccountCard account={account} />;
}

export default function AccountDataPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={AccountDataCardRenderer} />;
}
