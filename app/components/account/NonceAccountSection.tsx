import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { NonceAccount } from '@validators/accounts/nonce';
import React from 'react';

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

export function NonceAccountSection({ account, nonceAccount }: { account: Account; nonceAccount: NonceAccount }) {
    const refresh = useRefreshAccount();

    const rows: KeyValueRow[] = [
        { label: 'Authority', value: <Address pubkey={nonceAccount.info.authority} raw link /> },
        { label: 'Blockhash', value: <code>{nonceAccount.info.blockhash}</code> },
        {
            label: 'Fee',
            value: `${nonceAccount.info.feeCalculator.lamportsPerSignature} lamports per signature`,
        },
    ];

    return (
        <AccountCard
            title="Nonce Account"
            account={account}
            analyticsSection="nonce_account_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}
