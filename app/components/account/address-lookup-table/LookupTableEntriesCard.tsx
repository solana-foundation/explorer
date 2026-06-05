import { Address } from '@components/common/Address';
import { AddressLookupTableAccount, PublicKey } from '@solana/web3.js';
import { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';
import React from 'react';

import { CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';

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
        <div className="card">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Lookup Table Entries
                </CardTitle>
            </CardHeader>

            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="w-1 text-muted">Index</th>
                            <th className="text-muted">Address</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {lookupTableState.addresses.length > 0 &&
                            lookupTableState.addresses.map((entry: PublicKey, index) => {
                                return renderRow(entry, index);
                            })}
                    </tbody>
                </table>
            </div>

            {lookupTableState.addresses.length === 0 && (
                <CardFooter ui="dashkit">
                    <div className="e-text-center e-text-dk-gray-700">No entries found</div>
                </CardFooter>
            )}
        </div>
    );
}

const renderRow = (entry: PublicKey, index: number) => {
    return (
        <tr key={index}>
            <td className="w-1 e-font-mono">{index}</td>
            <td className="e-font-mono">
                <Address pubkey={entry} link />
            </td>
        </tr>
    );
};
