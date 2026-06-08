import { InspectorInstructionCard } from '@components/common/InspectorInstructionCard';
import { ParsedInstruction, SignatureResult, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { AddressWithContext } from '../AddressWithContext';

export function CreateIdempotentDetailsCard(props: {
    childIndex?: number;
    children?: React.ReactNode;
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
            title="Associated Token Program: Create Idempotent"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Source</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <AddressWithContext pubkey={raw.keys[0].pubkey} hideInfo />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Account</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <AddressWithContext pubkey={raw.keys[1].pubkey} hideInfo />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Wallet</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <AddressWithContext pubkey={raw.keys[2].pubkey} hideInfo />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Mint</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <AddressWithContext pubkey={raw.keys[3].pubkey} hideInfo />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>System Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <AddressWithContext pubkey={raw.keys[4].pubkey} hideInfo />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Token Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <AddressWithContext pubkey={raw.keys[5].pubkey} hideInfo />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCardComponent>
    );
}
