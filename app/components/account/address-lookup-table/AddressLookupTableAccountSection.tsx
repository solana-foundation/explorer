import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { AddressLookupTableAccount } from '@solana/web3.js';
import { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

export function AddressLookupTableAccountSection(
    params:
        | {
              account: Account;
              data: Uint8Array;
          }
        | {
              account: Account;
              lookupTableAccount: AddressLookupTableAccountInfo;
          },
) {
    const account = params.account;
    const lookupTableState = React.useMemo(() => {
        if ('data' in params) {
            return AddressLookupTableAccount.deserialize(params.data);
        } else {
            return params.lookupTableAccount;
        }
    }, [params]);
    const lookupTableAccount = new AddressLookupTableAccount({
        key: account.pubkey,
        state: lookupTableState,
    });
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Address Lookup Table Account"
            account={account}
            analyticsSection="address_lookup_table_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="text-right uppercase">
                    <SolBalance lamports={account.lamports} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Activation Status</BaseTable.Cell>
                <BaseTable.Cell className="text-right uppercase">
                    {lookupTableAccount.isActive() ? 'Active' : 'Deactivated'}
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Last Extended Slot</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {lookupTableAccount.state.lastExtendedSlot === 0 ? (
                        'None (Empty)'
                    ) : (
                        <Slot slot={lookupTableAccount.state.lastExtendedSlot} link />
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Authority</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {lookupTableAccount.state.authority === undefined ? (
                        'None (Frozen)'
                    ) : (
                        <Address pubkey={lookupTableAccount.state.authority} alignRight link />
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}
