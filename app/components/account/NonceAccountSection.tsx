import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { NonceAccount } from '@validators/accounts/nonce';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

export function NonceAccountSection({ account, nonceAccount }: { account: Account; nonceAccount: NonceAccount }) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Nonce Account"
            account={account}
            analyticsSection="nonce_account_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>Authority</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={nonceAccount.info.authority} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Blockhash</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <code>{nonceAccount.info.blockhash}</code>
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Fee</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {nonceAccount.info.feeCalculator.lamportsPerSignature} lamports per signature
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}
