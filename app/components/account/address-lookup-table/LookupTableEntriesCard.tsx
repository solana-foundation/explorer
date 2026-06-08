import { Address } from '@components/common/Address';
import { AddressLookupTableAccount, PublicKey } from '@solana/web3.js';
import { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function LookupTableEntriesCard(
    params:
        | {
              parsedLookupTable: AddressLookupTableAccountInfo;
          }
        | {
              lookupTableAccountData: Uint8Array;
          },
) {
    const lookupTableState = React.useMemo(() => {
        if ('lookupTableAccountData' in params) {
            return AddressLookupTableAccount.deserialize(params.lookupTableAccountData);
        } else {
            return params.parsedLookupTable;
        }
    }, [params]);

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Lookup Table Entries
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="e-w-px e-text-dk-gray-700">Index</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="e-text-dk-gray-700">Address</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body className="list">
                    {lookupTableState.addresses.length > 0 &&
                        lookupTableState.addresses.map((entry: PublicKey, index) => {
                            return renderRow(entry, index);
                        })}
                </BaseTable.Body>
            </BaseTable>

            {lookupTableState.addresses.length === 0 && (
                <CardFooter ui="dashkit">
                    <div className="e-text-center e-text-dk-gray-700">No entries found</div>
                </CardFooter>
            )}
        </Card>
    );
}

const renderRow = (entry: PublicKey, index: number) => {
    return (
        <BaseTable.Row key={index}>
            <BaseTable.Cell className="e-w-px e-font-mono">{index}</BaseTable.Cell>
            <BaseTable.Cell className="e-font-mono">
                <Address pubkey={entry} link />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
};
