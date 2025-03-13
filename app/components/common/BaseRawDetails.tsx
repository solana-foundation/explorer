import { Address } from '@components/common/Address';
import { MessageCompiledInstruction, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { AddressFromLookupTableWithContext, AddressWithContext } from '../inspector/AddressWithContext';
import { fillAddressTableLookupsAccounts, findLookupAddress } from '../inspector/utils';
import { HexData } from './HexData';

/**
 *  Component that displays accounts from any Instruction.
 *
 *  VersionedMessage is optional as it will be present at inspector page only.
 */
export function BaseRawDetails({
    ix,
    message,
}: {
    ix: TransactionInstruction | MessageCompiledInstruction;
    message?: VersionedMessage;
}) {
    if (message && 'accountKeyIndexes' in ix) {
        return <BaseMessageCompiledInstructionRawDetails ix={ix} message={message} />;
    } else if ('keys' in ix) {
        return <BaseTransactionInstructionRawDetails ix={ix} />;
    } else {
        // according curretn types other variants are impossible
        throw new Error('Unsupported instruction type');
    }
}

function BaseTransactionInstructionRawDetails({ ix }: { ix: TransactionInstruction }) {
    return (
        <>
            {ix.keys.map(({ pubkey, isSigner, isWritable }, keyIndex) => (
                <tr key={keyIndex}>
                    <td>
                        <div className="me-2 d-md-inline">Account #{keyIndex + 1}</div>
                        {isWritable && <span className="badge bg-danger-soft me-1">Writable</span>}
                        {isSigner && <span className="badge bg-info-soft me-1">Signer</span>}
                    </td>
                    <td className="text-lg-end">
                        <Address pubkey={pubkey} alignRight link />
                    </td>
                </tr>
            ))}

            <tr>
                <td>
                    Instruction Data <span className="text-muted">(Hex)</span>
                </td>
                <td className="text-lg-end">
                    <HexData raw={ix.data} />
                </td>
            </tr>
        </>
    );
}

function BaseMessageCompiledInstructionRawDetails({
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

            <tr>
                <td>
                    Instruction Data <span className="text-muted">(Hex)</span>
                </td>
                <td className="text-lg-end">
                    <HexData raw={Buffer.from(ix.data)} />
                </td>
            </tr>
        </>
    );
}
