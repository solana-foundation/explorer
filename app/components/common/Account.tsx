import { SolBalance } from '@components/common/SolBalance';
import { Account } from '@providers/accounts';
import { RefreshButton } from '@shared/ui/refresh-button';
import React from 'react';

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
        <div className="card-header align-items-center">
            <h3 className="card-header-title">{title}</h3>
            <RefreshButton analyticsSection={analyticsSection} onClick={refresh} />
        </div>
    );
}

export function AccountAddressRow({ account }: AccountProps) {
    return (
        <tr>
            <td>Address</td>
            <td className="text-lg-end">
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
            <td className="text-lg-end text-uppercase">
                <SolBalance lamports={lamports} />
            </td>
        </tr>
    );
}
