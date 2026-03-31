import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { NonceAccount } from '@validators/accounts/nonce';
import React from 'react';

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

            <tr>
                <td>Authority</td>
                <td className="text-lg-end">
                    <Address pubkey={nonceAccount.info.authority} alignRight raw link />
                </td>
            </tr>

            <tr>
                <td>Blockhash</td>
                <td className="text-lg-end">
                    <code>{nonceAccount.info.blockhash}</code>
                </td>
            </tr>

            <tr>
                <td>Fee</td>
                <td className="text-lg-end">
                    {nonceAccount.info.feeCalculator.lamportsPerSignature} lamports per signature
                </td>
            </tr>
        </AccountCard>
    );
}
