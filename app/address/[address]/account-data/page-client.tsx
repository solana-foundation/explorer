'use client';

// `lib/program-address` rather than the barrel, matching `layout.tsx`. Here it is consistency rather than weight
// saving, because the barrel arrives with `PmpAccountCard` below anyway.
import { isPmpAccount } from '@entities/pmp-account/lib/program-address';
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
