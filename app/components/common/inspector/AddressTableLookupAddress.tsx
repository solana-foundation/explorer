import { AddressFromLookupTableWithContext, AddressWithContext } from '@components/inspector/AddressWithContext';
import { fillAddressTableLookupsAccounts, findLookupAddress } from '@components/inspector/utils';
import { VersionedMessage } from '@solana/web3.js';
import React from 'react';

export function AddressTableLookupAddress({
    accountIndex,
    message,
    hideInfo,
}: {
    accountIndex: number;
    message: VersionedMessage;
    hideInfo?: boolean;
}) {
    const lookupsForAccountKeyIndex = fillAddressTableLookupsAccounts(message.addressTableLookups);
    const { lookup, dynamicLookups } = findLookupAddress(accountIndex, message, lookupsForAccountKeyIndex);

    return (
        <>
            {dynamicLookups.isStatic ? (
                <AddressWithContext pubkey={lookup} hideInfo={hideInfo} />
            ) : (
                <AddressFromLookupTableWithContext
                    lookupTableKey={dynamicLookups.lookups.lookupTableKey}
                    lookupTableIndex={dynamicLookups.lookups.lookupTableIndex}
                    hideInfo={hideInfo}
                />
            )}
        </>
    );
}
