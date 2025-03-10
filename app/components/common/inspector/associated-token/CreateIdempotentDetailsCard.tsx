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

export function CreateIdempotentDetailsCard(props: {
    childIndex?: number;
    children?: React.ReactNode;
    index: number;
    info: ParsedCreateAssociatedTokenIdempotentInstruction;
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
        children,
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
            title="Associated Token Program: Create Idempotent"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Source</td>
                <td className="text-lg-end">
                    <Address pubkey={info.source} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Account</td>
                <td className="text-lg-end">
                    <Address pubkey={info.account} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Wallet</td>
                <td className="text-lg-end">
                    <Address pubkey={info.wallet} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Mint</td>
                <td className="text-lg-end">
                    <Address pubkey={info.mint} alignRight link />
                </td>
            </tr>

            <tr>
                <td>System Program</td>
                <td className="text-lg-end">
                    <Address pubkey={info.systemProgram} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Token Program</td>
                <td className="text-lg-end">
                    <Address pubkey={info.tokenProgram} alignRight link />
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
