import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import {
    MessageCompiledInstruction,
    ParsedInstruction,
    SignatureResult,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import { ParsedCreateAssociatedTokenIdempotentInstruction } from '@solana-program/token';
import React from 'react';

import { AddressFromLookupTableWithContext, AddressWithContext } from '../../../inspector/AddressWithContext';
import { fillAddressTableLookupsAccounts, findLookupAddress } from '../../../inspector/utils';

export function CreateIdempotentDetailsCard(props: {
    childIndex?: number;
    children?: React.ReactNode;
    index: number;
    info: ParsedCreateAssociatedTokenIdempotentInstruction['accounts'];
    innerCards?: JSX.Element[];
    ix: ParsedInstruction;
    message?: VersionedMessage;
    raw: TransactionInstruction | MessageCompiledInstruction;
    result: SignatureResult;
    InstructionCardComponent?: React.FC<Parameters<typeof InspectorInstructionCard>[0]>;
}) {
    const {
        ix,
        index,
        info,
        raw,
        message,
        result,
        innerCards,
        childIndex,
        InstructionCardComponent = InspectorInstructionCard,
    } = props;

    console.log(8989, info, message, raw?.keys, raw?.accountKeyIndexes);

    let accountKeys;
    if ('accountKeyIndexes' in raw) {
        accountKeys = raw.accountKeyIndexes;
    }

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            message={message}
            raw={raw}
            result={result}
            title="Associated Token Program: Create Idempotent"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Payer</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[0]} message={message} />
                    ) : null}
                </td>
            </tr>
            <tr>
                <td>Account</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[1]} message={message} />
                    ) : null}
                </td>
            </tr>

            <tr>
                <td>Wallet</td>
                <td className="text-lg-end">
                     {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[2]} message={message} />
                    ) : null}
                </td>
            </tr>

            <tr>
                <td>Mint</td>
                <td className="text-lg-end">
                     {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[3]} message={message} />
                    ) : null}
                </td>
            </tr>

            <tr>
                <td>System Program</td>
                <td className="text-lg-end">
                     {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[4]} message={message} />
                    ) : null}
                </td>
            </tr>

            <tr>
                <td>Token Program</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[5]} message={message} />
                    ) : null}
                </td>
            </tr>
        </InstructionCardComponent>
    );
}

function AddressTableLookupAddress({ accountIndex, message }: { accountIndex: number; message: VersionedMessage }) {
    const lookupsForAccountKeyIndex = fillAddressTableLookupsAccounts(message.addressTableLookups);
    const { lookup, dynamicLookups } = findLookupAddress(accountIndex, message, lookupsForAccountKeyIndex);

    return (
        <>
            {dynamicLookups.isStatic ? (
                <AddressWithContext pubkey={lookup} hideInfo />
            ) : (
                <AddressFromLookupTableWithContext
                    lookupTableKey={dynamicLookups.lookups.lookupTableKey}
                    lookupTableIndex={dynamicLookups.lookups.lookupTableIndex}
                    hideInfo
                />
            )}
        </>
    );
}
