import { MessageCompiledInstruction, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { AddressFromLookupTableWithContext, AddressWithContext } from './AddressWithContext';
import { fillAddressTableLookupsAccounts, findLookupAddress } from './utils';

export function BaseAddressLookupDetails({
    ix,
    message,
}: {
    ix: MessageCompiledInstruction;
    message: VersionedMessage;
}) {
    const lookupsForAccountKeyIndex = fillAddressTableLookupsAccounts(message.addressTableLookups);

    return (
        <>
            {ix.accountKeyIndexes.map((accountIndex, index) => {
                const { lookup, dynamicLookups } = findLookupAddress(accountIndex, message, lookupsForAccountKeyIndex);

                return (
                    <tr key={index}>
                        <td>
                            <div className="d-flex align-items-start flex-column">
                                Account #{index + 1}
                                <span className="mt-1">
                                    {accountIndex < message.header.numRequiredSignatures && (
                                        <span className="badge bg-info-soft me-2">Signer</span>
                                    )}
                                    {message.isAccountWritable(accountIndex) && (
                                        <span className="badge bg-danger-soft me-2">Writable</span>
                                    )}
                                </span>
                            </div>
                        </td>
                        <td className="text-lg-end">
                            {dynamicLookups.isStatic ? (
                                <AddressWithContext pubkey={lookup} />
                            ) : (
                                <AddressFromLookupTableWithContext
                                    lookupTableKey={dynamicLookups.lookups.lookupTableKey}
                                    lookupTableIndex={dynamicLookups.lookups.lookupTableIndex}
                                />
                            )}
                        </td>
                    </tr>
                );
            })}
        </>
    );
}
