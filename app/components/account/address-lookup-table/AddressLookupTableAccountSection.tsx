import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { AddressLookupTableAccount } from '@solana/web3.js';
import { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';
import React from 'react';

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

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

    const rows: KeyValueRow[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        { label: 'Balance (SOL)', value: <SolBalance lamports={account.lamports} />, valueClassName: 'uppercase' },
        {
            label: 'Activation Status',
            value: lookupTableAccount.isActive() ? 'Active' : 'Deactivated',
            valueClassName: 'uppercase',
        },
        {
            label: 'Last Extended Slot',
            value:
                lookupTableAccount.state.lastExtendedSlot === 0 ? (
                    'None (Empty)'
                ) : (
                    <Slot slot={lookupTableAccount.state.lastExtendedSlot} link />
                ),
        },
        {
            label: 'Authority',
            value:
                lookupTableAccount.state.authority === undefined ? (
                    'None (Frozen)'
                ) : (
                    <Address pubkey={lookupTableAccount.state.authority} link />
                ),
        },
    ];

    return (
        <AccountCard
            title="Address Lookup Table Account"
            account={account}
            analyticsSection="address_lookup_table_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}
