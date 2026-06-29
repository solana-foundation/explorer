import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { BasePublisherOperationParams } from './program';

export default function BasePublisherOperationCard({
    ix,
    index,
    result,
    operationName,
    info,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    operationName: string;
    info: BasePublisherOperationParams;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`Pyth: ${operationName}`}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={ix.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Price Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.pricePubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Publisher</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.publisherPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
