import { SolBalance } from '@components/common/SolBalance';
import { Account } from '@providers/accounts';
import { RefreshButton } from '@shared/ui/refresh-button';
import React from 'react';

import { CardHeader, CardTitle } from '@/app/shared/ui/Card';

import { Address } from './Address';

type AccountHeaderProps = {
    title: string;
    analyticsSection: string;
    refresh: () => void;
};

type AccountProps = {
    account: Account;
};

export function AccountHeader({ title, analyticsSection, refresh }: AccountHeaderProps) {
    return (
        <CardHeader ui="dashkit">
            <CardTitle as="h3" ui="dashkit">
                {title}
            </CardTitle>
            <RefreshButton analyticsSection={analyticsSection} onClick={refresh} />
        </CardHeader>
    );
}

export function AccountAddressRow({ account }: AccountProps) {
    return (
        <tr>
            <td>Address</td>
            <td className="e-text-right">
                <Address pubkey={account.pubkey} alignRight raw />
            </td>
        </tr>
    );
}

export function AccountBalanceRow({ account }: AccountProps) {
    const { lamports } = account;
    return (
        <tr>
            <td>Balance (SOL)</td>
            <td className="e-text-right e-uppercase">
                <SolBalance lamports={lamports} />
            </td>
        </tr>
    );
}
