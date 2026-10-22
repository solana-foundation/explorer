import { SolBalance } from '@components/common/SolBalance';
import { RefreshButton } from '@components/shared/ui/refresh-button';
import { Account } from '@providers/accounts';
import React from 'react';

import { CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { KeyValue } from '@/app/shared/ui/key-value';

import { Address } from './Address';

type AccountHeaderProps = {
    title: string;
    analyticsSection: string;
    refresh: () => void;
    fetching?: boolean;
};

type AccountProps = {
    account: Account;
};

export function AccountHeader({ title, analyticsSection, refresh, fetching }: AccountHeaderProps) {
    return (
        <CardHeader ui="dashkit">
            <CardTitle as="h3" ui="dashkit">
                {title}
            </CardTitle>
            <RefreshButton analyticsSection={analyticsSection} onClick={refresh} fetching={fetching} />
        </CardHeader>
    );
}

export function AccountAddressRow({ account }: AccountProps) {
    return (
        <KeyValue label="Address">
            <Address pubkey={account.pubkey} raw />
        </KeyValue>
    );
}

export function AccountBalanceRow({ account }: AccountProps) {
    return (
        <KeyValue label="Balance (SOL)" valueClassName="uppercase">
            <SolBalance lamports={account.lamports} />
        </KeyValue>
    );
}
