import { Address } from '@components/common/Address';
import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import { ParsedInstruction, SignatureResult, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { AddressWithContext } from '../AddressWithContext';

export function RecoverNestedDetailsCard(props: {
    childIndex?: number;
    index: number;
    innerCards?: JSX.Element[];
    ix: ParsedInstruction;
    message: VersionedMessage;
    raw: TransactionInstruction;
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
                    <AddressWithContext pubkey={raw.keys[2].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Nested Mint</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[1].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Nested Owner</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[3].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Nested Source</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[0].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Owner Mint</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[4].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Owner</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[5].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Token Program</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[6].pubkey} hideInfo />
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
