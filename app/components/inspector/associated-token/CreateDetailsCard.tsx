import { Address } from '@components/common/Address';
import { AddressTableLookupAddress } from '@components/common/inspector/AddressTableLookupAddress';
import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import { MessageCompiledInstruction, ParsedInstruction, SignatureResult, VersionedMessage } from '@solana/web3.js';
import React from 'react';

export function CreateDetailsCard({
    childIndex,
    index,
    innerCards,
    ix,
    message,
    raw,
    result,
    InstructionCardComponent = InspectorInstructionCard,
}: {
    childIndex?: number;
    index: number;
    innerCards?: JSX.Element[];
    ix: ParsedInstruction;
    message: VersionedMessage;
    raw: MessageCompiledInstruction;
    result: SignatureResult;
    InstructionCardComponent?: React.FC<Parameters<typeof InspectorInstructionCard>[0]>;
}) {
    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            message={message}
            raw={raw}
            result={result}
            title="Associated Token Program: Create"
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
                <td>Source</td>
                <td className="text-lg-end">
                    <AddressTableLookupAddress accountIndex={raw.accountKeyIndexes[0]} message={message} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Account</td>
                <td className="text-lg-end">
                    <AddressTableLookupAddress accountIndex={raw.accountKeyIndexes[1]} message={message} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Mint</td>
                <td className="text-lg-end">
                    <AddressTableLookupAddress accountIndex={raw.accountKeyIndexes[3]} message={message} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Wallet</td>
                <td className="text-lg-end">
                    <AddressTableLookupAddress accountIndex={raw.accountKeyIndexes[2]} message={message} hideInfo />
                </td>
            </tr>
            <tr>
                <td>System Program</td>
                <td className="text-lg-end">
                    <AddressTableLookupAddress accountIndex={raw.accountKeyIndexes[4]} message={message} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Token Program</td>
                <td className="text-lg-end">
                    <AddressTableLookupAddress accountIndex={raw.accountKeyIndexes[5]} message={message} hideInfo />
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
