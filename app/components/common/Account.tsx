import { SolBalance } from '@components/common/SolBalance';
import { Account } from '@providers/accounts';
import { RefreshButton } from '@shared/ui/refresh-button';
import React from 'react';

import { CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

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
        <BaseTable.Row>
            <BaseTable.Cell>Address</BaseTable.Cell>
            <BaseTable.Cell className="e-text-right">
                <Address pubkey={account.pubkey} alignRight raw />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function AccountBalanceRow({ account }: AccountProps) {
    const { lamports } = account;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
            <BaseTable.Cell className="e-text-right e-uppercase">
                <SolBalance lamports={lamports} />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
