import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { TradingStatus, UpdatePriceParams } from './program';

export default function UpdatePriceDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: UpdatePriceParams;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Pyth: Update Price"
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
                <BaseTable.Cell>Publisher</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.publisherPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Price Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.pricePubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Status</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{TradingStatus[info.status]}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Price</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.price}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Conf</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.conf}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Publish Slot</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.publishSlot}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
