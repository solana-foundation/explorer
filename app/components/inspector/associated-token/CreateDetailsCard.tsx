import { Address } from '@components/common/Address';
import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import { ParsedInstruction, SignatureResult, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { AddressWithContext } from '../AddressWithContext';

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
    raw: TransactionInstruction;
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
                    <AddressWithContext pubkey={raw.keys[0].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Account</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[1].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Mint</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[3].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Wallet</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[2].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>System Program</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[4].pubkey} hideInfo />
                </td>
            </tr>
            <tr>
                <td>Token Program</td>
                <td className="text-lg-end">
                    <AddressWithContext pubkey={raw.keys[5].pubkey} hideInfo />
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
