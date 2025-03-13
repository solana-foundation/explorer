import { Address } from '@components/common/Address';
import { AddressTableLookupAddress } from '@components/common/inspector/AddressTableLookupAddress';
import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import {
    MessageCompiledInstruction,
    ParsedInstruction,
    SignatureResult,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import React from 'react';

export function RecoverNestedDetailsCard(props: {
    childIndex?: number;
    index: number;
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
        raw,
        message,
        result,
        innerCards,
        childIndex,
        InstructionCardComponent = InspectorInstructionCard,
    } = props;

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
            title="Associated Token Program: Recover Nested"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Destination</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[2]} message={message} hideInfo />
                    ) : null}
                </td>
            </tr>
            <tr>
                <td>Nested Mint</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[1]} message={message} hideInfo />
                    ) : null}
                </td>
            </tr>
            <tr>
                <td>Nested Owner</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[3]} message={message} hideInfo />
                    ) : null}
                </td>
            </tr>
            <tr>
                <td>Nested Source</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[0]} message={message} hideInfo />
                    ) : null}
                </td>
            </tr>
            <tr>
                <td>Owner Mint</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[4]} message={message} hideInfo />
                    ) : null}
                </td>
            </tr>
            <tr>
                <td>Owner</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[5]} message={message} hideInfo />
                    ) : null}
                </td>
            </tr>
            <tr>
                <td>Token Program</td>
                <td className="text-lg-end">
                    {message && accountKeys ? (
                        <AddressTableLookupAddress accountIndex={accountKeys[6]} message={message} hideInfo />
                    ) : null}
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
